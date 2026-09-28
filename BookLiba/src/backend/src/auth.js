const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["Authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Нет заголовка авторизации" });
  }

  const splittedAuthHeader = authHeader.split(" ");
  const authType = splittedAuthHeader[0];
  const token = splittedAuthHeader[1];
  if (!authType || authType.toLowerCase() != "bearer") {
    return res.status(401).json({ error: "Не bearer или нет токена вовсе" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Токен невалидный" });
    }

    req.user = user;
    next();
  });
}

const ROLE_HIERARCHY = {
  user: 1,
  vip: 2,
  admin: 3,
};

function requireMinRole(minRole) {
  return (req, res, next) => {
    const userRoleStr = req.user.role;
    if (!userRoleStr || !req.user) {
      return res
        .status(403)
        .json({ error: "Нет роли или пользователь не аутентифицирован" });
    }

    const userRole = ROLE_HIERARCHY[userRoleStr] || -1;
    const minRoleValue = ROLE_HIERARCHY[minRole] || Number.MAX_SAFE_INTEGER;

    if (userRole < minRoleValue) {
      return res
        .status(403)
        .json({ error: "Недостаточно прав для доступа к этому ресурсу" });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireMinRole,
  JWT_SECRET,
};
