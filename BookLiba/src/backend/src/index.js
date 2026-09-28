const SALT_ROUNDS = 10;

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db/db.js");

const app = express();
const PORT = process.env.PORT || 5000;
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authenticateToken, requireMinRole, JWT_SECRET } = require("./auth.js");
const adminRoutes = require("./routes/admin.js");
const { logger, httpLogger } = require("./logger.js");
const { authLimiter } = require("./middleware/rateLimiter.js");
const { createSession, deactivateSession } = require("./session.js");
const { sendPasswordResetEmail } = require("./email.js");
const redis = require("./redis.js");

app.use(cors());
app.use(express.json());
app.use(httpLogger);

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Разрешены только файлы изображений (jpg, png, webp и др.)"),
      );
    }
  },
});

function validateBookData(title, author, year) {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return 'Поле "Название книги" обязательно для заполнения';
  }
  if (title.trim().length > 255) {
    return "Название книги не должно превышать 255 символов";
  }
  if (!author || typeof author !== "string" || author.trim().length === 0) {
    return 'Поле "Автор" обязательно для заполнения';
  }
  if (author.trim().length > 255) {
    return "Имя автора не должно превышать 255 символов";
  }
  if (year !== undefined && year !== null && year !== "") {
    const parsedYear = Number(year);
    const currentYear = new Date().getFullYear();
    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < -3000 ||
      parsedYear > currentYear
    ) {
      return `Год издания должен быть числом в диапазоне от -3000 до ${currentYear}`;
    }
  }
  return null;
}

app.use("/api/books", authenticateToken, requireMinRole("user"));

app.get("/api/books", async (req, res) => {
  try {
    const user = req.user;
    const result = await pool.query(
      `SELECT id, title, author, year, cover_url 
      FROM books
      WHERE user_id = $1
      ORDER BY id DESC`,
      [user.id],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error GET /api/books:", err);
    res.status(500).json({ error: "Не удалось получить список книг" });
  }
});

app.get("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`Error GET /api/books/${id}:`, err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.post("/api/books", upload.single("cover"), async (req, res) => {
  const { title, author, year } = req.body;

  const validationError = validateBookData(title, author, year);
  if (validationError) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: validationError });
  }

  const coverUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedYear = year ? parseInt(year, 10) : null;

  try {
    const result = await pool.query(
      "INSERT INTO books (title, author, year, cover_url, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title.trim(), author.trim(), parsedYear, coverUrl, req.user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error POST /api/books:", err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Не удалось сохранить книгу в базе данных" });
  }
});

app.put("/api/books/:id", upload.single("cover"), async (req, res) => {
  const { id } = req.params;
  const { title, author, year } = req.body;

  const validationError = validateBookData(title, author, year);
  if (validationError) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: validationError });
  }

  try {
    const existing = await pool.query("SELECT * FROM books WHERE id = $1", [
      id,
    ]);
    if (existing.rows.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }

    let coverUrl = existing.rows[0].cover_url;

    if (req.file) {
      if (coverUrl) {
        const oldFilePath = path.join(__dirname, "..", coverUrl);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      coverUrl = `/uploads/${req.file.filename}`;
    }

    const parsedYear = year ? parseInt(year, 10) : null;
    const result = await pool.query(
      "UPDATE books SET title = $1, author = $2, year = $3, cover_url = $4 WHERE id = $5 RETURNING *",
      [title.trim(), author.trim(), parsedYear, coverUrl, id],
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`Error PUT /api/books/${id}:`, err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Не удалось обновить книгу" });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM books WHERE id = $1 RETURNING cover_url",
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }

    const coverUrl = result.rows[0].cover_url;
    if (coverUrl) {
      const filePath = path.join(__dirname, "..", coverUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: "Книга успешно удалена" });
  } catch (err) {
    console.error(`Error DELETE /api/books/${id}:`, err);
    res.status(500).json({ error: "Не удалось удалить книгу" });
  }
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ error: "Логин обязателен" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res
      .status(400)
      .json({ error: "Email обязателен и должен быть корректным адресом" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Пароль обязателен и должен содержать не менее 6 символов" });
  }

  const userFromDb = await pool.query(
    "SELECT id, username, email FROM users WHERE username = $1 OR email = $2 LIMIT 1",
    [username.trim(), email.trim().toLowerCase()],
  );

  if (userFromDb.rows.length !== 0) {
    const existing = userFromDb.rows[0];
    if (existing.username.toLowerCase() === username.trim().toLowerCase()) {
      return res
        .status(409)
        .json({ error: "Пользователь с таким username уже существует" });
    }
    return res
      .status(409)
      .json({ error: "Пользователь с таким email уже существует" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const insertUser = await pool.query(
    "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, role, email, bg_color",
    [username.trim(), passwordHash, email.trim().toLowerCase()],
  );
  const newUser = insertUser.rows[0];

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await createSession(newUser.id, newUser.username, newUser.role, token, req);

  res.status(201).json({
    message: "Пользователь успешно зарегистрирован",
    accessToken: token,
    bgColor: newUser.bg_color || "#121214",
  });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Логин и пароль обязательны" });
  }
  const userFromDb = await pool.query(
    "SELECT id, username, password_hash, role, bg_color FROM users WHERE username = $1 LIMIT 1",
    [username],
  );

  if (userFromDb.rows.length === 0) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const user = userFromDb.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  const role = user.role;

  const token = jwt.sign(
    { id: user.id, username: user.username, role },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await createSession(user.id, user.username, role, token, req);

  res.status(200).json({
    message: "Успешный вход в систему",
    accessToken: token,
    bgColor: user.bg_color || "#121214",
  });
});

app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    await deactivateSession(req.token);
    res.status(200).json({ message: "Сессия успешно завершена" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при выходе из системы" });
  }
});

app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Укажите корректный email адрес" });
  }

  try {
    const userRes = await pool.query(
      "SELECT id, username FROM users WHERE email = $1 LIMIT 1",
      [email.trim().toLowerCase()],
    );

    if (userRes.rows.length === 0) {
      return res.status(200).json({
        message:
          "Если данный email зарегистрирован, инструкция по сбросу пароля отправлена.",
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");

    await redis.set(`password_reset:${resetToken}`, user.id, "EX", 900);

    const previewUrl = await sendPasswordResetEmail(
      email.trim().toLowerCase(),
      resetToken,
    );

    res.status(200).json({
      message:
        "Ссылка для сброса пароля отправлена на почту (действительна 15 минут).",
      previewUrl: typeof previewUrl === "string" ? previewUrl : undefined,
      resetToken,
    });
  } catch (err) {
    logger.error({ err }, "Error requesting password reset");
    res
      .status(500)
      .json({ error: "Не удалось отправить письмо для сброса пароля" });
  }
});

app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Токен сброса и новый пароль обязательны" });
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Пароль должен содержать не менее 6 символов" });
  }

  try {
    const userId = await redis.get(`password_reset:${token}`);
    if (!userId) {
      return res.status(400).json({
        error:
          "Ссылка для сброса пароля недействительна или истёк срок её действия (15 минут)",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      userId,
    ]);

    await redis.del(`password_reset:${token}`);

    logger.info(
      { userId },
      "User password successfully reset via email",
    );
    res.status(200).json({
      message:
        "Пароль успешно изменён! Теперь вы можете войти с новым паролем.",
    });
  } catch (err) {
    logger.error({ err }, "Error resetting password");
    res.status(500).json({ error: "Не удалось обновить пароль" });
  }
});

app.patch(
  "/api/users/theme",
  authenticateToken,
  requireMinRole("vip"),
  async (req, res) => {
    const { bgColor } = req.body;

    if (!bgColor || typeof bgColor !== "string") {
      return res.status(400).json({ error: "Некорректный цвет фона" });
    }

    try {
      const username = req.user.username;
      const result = await pool.query(
        "UPDATE users SET bg_color = $1 WHERE username = $2 RETURNING bg_color",
        [bgColor, username],
      );

      res.status(200).json({
        message: "Тема успешно обновлена",
        bgColor: result.rows[0].bg_color,
      });
    } catch (err) {
      console.error("Error updating theme:", err);
      res.status(500).json({ error: "Не удалось сохранить тему оформления" });
    }
  },
);

async function initDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (                                       
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      bg_color VARCHAR(30) DEFAULT '#121214',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      year INT,
      cover_url VARCHAR(500),
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    logger.info("Database initialized successfully");
  } catch (err) {
    logger.error({ err }, "Error initializing database");
    process.exit(1);
  }
}

app.use((err, req, res, next) => {
  req.log ? req.log.error(err) : logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Внутренняя ошибка сервера",
  });
});

initDb().then(() => {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `Server is running on port ${PORT}`);
  });
});
