const rateLimit = require("express-rate-limit");
const { logger } = require("../logger.js");

const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error:
      "Слишком много попыток входа с вашего IP-адреса. Доступ заблокирован на 3 минуты.",
  },
  handler: (req, res, next, options) => {
    logger.warn(
      { ip: req.ip, path: req.originalUrl },
      "Rate limiter: too many login attempts, IP temporarily blocked for 3 minutes",
    );
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { authLimiter };
