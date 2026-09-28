const Redis = require("ioredis");
const { logger } = require("./logger.js");

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Успешное подключение к Redis");
});

redis.on("error", (err) => {
  logger.warn(
    { error: err.message },
    "Предупреждение Redis (проверьте, запущен ли Redis на порту 6379)",
  );
});

module.exports = redis;
