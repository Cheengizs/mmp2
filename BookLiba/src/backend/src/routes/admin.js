const express = require("express");
const router = express.Router();
const pool = require("../../db/db.js");
const { authenticateToken, requireMinRole } = require("../auth.js");
const { getActiveSessions, deactivateSession } = require("../session.js");

router.use(authenticateToken, requireMinRole("admin"));

router.get("/users", async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, role, bg_color, created_at FROM users ORDER BY id ASC",
  );
  res.json(result.rows);
});

router.delete("/users/:id", async (req, res) => {
  await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.json({ message: "Пользователь удалён" });
});

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await getActiveSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Не удалось получить список сессий из Redis" });
  }
});

router.post("/sessions/deactivate", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Токен сессии обязателен" });
  }

  try {
    await deactivateSession(token);
    res.json({ message: "Сессия успешно деактивирована в Redis" });
  } catch (err) {
    res.status(500).json({ error: "Не удалось деактивировать сессию" });
  }
});

module.exports = router;
