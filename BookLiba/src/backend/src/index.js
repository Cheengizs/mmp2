const path = require('path');
// Загрузка .env СТРОГО до подключения модуля db
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db/db.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Каталог для хранения загруженных обложек
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Конфигурация multer для multipart/form-data
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Ограничение: 5 МБ
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы изображений (jpg, png, webp и др.)'));
    }
  },
});

// Серверная валидация входных данных
function validateBookData(title, author, year) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return 'Поле "Название книги" обязательно для заполнения';
  }
  if (title.trim().length > 255) {
    return 'Название книги не должно превышать 255 символов';
  }
  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    return 'Поле "Автор" обязательно для заполнения';
  }
  if (author.trim().length > 255) {
    return 'Имя автора не должно превышать 255 символов';
  }
  if (year !== undefined && year !== null && year !== '') {
    const parsedYear = Number(year);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(parsedYear) || parsedYear < -3000 || parsedYear > currentYear) {
      return `Год издания должен быть числом в диапазоне от -3000 до ${currentYear}`;
    }
  }
  return null;
}

// 1. GET /api/books — список всех книг
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка GET /api/books:', err);
    res.status(500).json({ error: 'Не удалось получить список книг' });
  }
});

// 2. GET /api/books/:id — получение одной книги
app.get('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`Ошибка GET /api/books/${id}:`, err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// 3. POST /api/books — создание книги
app.post('/api/books', upload.single('cover'), async (req, res) => {
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
      'INSERT INTO books (title, author, year, cover_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), author.trim(), parsedYear, coverUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка POST /api/books:', err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Не удалось сохранить книгу в базе данных' });
  }
});

// 4. PUT /api/books/:id — обновление данных книги
app.put('/api/books/:id', upload.single('cover'), async (req, res) => {
  const { id } = req.params;
  const { title, author, year } = req.body;

  const validationError = validateBookData(title, author, year);
  if (validationError) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: validationError });
  }

  try {
    const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }

    let coverUrl = existing.rows[0].cover_url;

    if (req.file) {
      if (coverUrl) {
        const oldFilePath = path.join(__dirname, '..', coverUrl);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      coverUrl = `/uploads/${req.file.filename}`;
    }

    const parsedYear = year ? parseInt(year, 10) : null;
    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, year = $3, cover_url = $4 WHERE id = $5 RETURNING *',
      [title.trim(), author.trim(), parsedYear, coverUrl, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`Ошибка PUT /api/books/${id}:`, err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Не удалось обновить книгу' });
  }
});

// 5. DELETE /api/books/:id — удаление книги
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING cover_url', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Книга с ID ${id} не найдена` });
    }

    const coverUrl = result.rows[0].cover_url;
    if (coverUrl) {
      const filePath = path.join(__dirname, '..', coverUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: 'Книга успешно удалена' });
  } catch (err) {
    console.error(`Ошибка DELETE /api/books/${id}:`, err);
    res.status(500).json({ error: 'Не удалось удалить книгу' });
  }
});

// Применение SQL и запуск сервера
async function initDb() {
  try {
    const sqlPath = path.join(__dirname, '../../../db/db.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      await pool.query(sql);
      console.log('Database initialized successfully');
    }
  } catch (err) {
    console.error('Error initializing database:', err.message);
    process.exit(1);
  }
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});