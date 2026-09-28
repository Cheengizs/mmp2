const redis = require("./redis.js");

const SESSION_TTL = 3600;

async function createSession(userId, username, role, token, req) {
  const ip = req.ip || req.connection?.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown";

  const sessionData = {
    userId,
    username,
    role,
    jwtToken: token,
    ip,
    userAgent,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await redis.set(
    `session:${token}`,
    JSON.stringify(sessionData),
    "EX",
    SESSION_TTL,
  );
  await redis.sadd("active_session_tokens", token);
  return sessionData;
}

async function isSessionActive(token) {
  try {
    const raw = await redis.get(`session:${token}`);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return session.isActive === true;
  } catch (err) {
    return true;
  }
}

async function deactivateSession(token) {
  try {
    const raw = await redis.get(`session:${token}`);
    if (raw) {
      const session = JSON.parse(raw);
      session.isActive = false;
      const ttl = await redis.ttl(`session:${token}`);
      if (ttl > 0) {
        await redis.set(
          `session:${token}`,
          JSON.stringify(session),
          "EX",
          ttl,
        );
      } else {
        await redis.del(`session:${token}`);
      }
    }
    await redis.srem("active_session_tokens", token);
  } catch (err) {
  }
}

async function getActiveSessions() {
  const tokens = await redis.smembers("active_session_tokens");
  if (!tokens || tokens.length === 0) return [];

  const pipeline = redis.pipeline();
  tokens.forEach((t) => pipeline.get(`session:${t}`));
  const results = await pipeline.exec();

  const sessions = [];
  const expiredTokens = [];

  for (let i = 0; i < tokens.length; i++) {
    const [err, res] = results[i];
    if (res) {
      const parsed = JSON.parse(res);
      sessions.push(parsed);
    } else {
      expiredTokens.push(tokens[i]);
    }
  }

  if (expiredTokens.length > 0) {
    await redis.srem("active_session_tokens", ...expiredTokens);
  }

  return sessions;
}

module.exports = {
  createSession,
  isSessionActive,
  deactivateSession,
  getActiveSessions,
};
