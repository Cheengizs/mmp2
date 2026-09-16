import { pool } from '../db/index.js';
import {
  uploadCoverBlob,
  deleteCoverBlob,
  getCoverUrl,
  downloadCoverBlobStream
} from '../services/blobStorage.js';
import {
  createBookSchema,
  updateBookSchema,
  updateStatusSchema
} from '../validators/bookValidator.js';

function formatBookRow(row, req) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    authorId: row.author_id,
    genreId: row.genre_id,
    year: row.year,
    status: row.status,
    description: row.description,
    coverBlobName: row.cover_blob_name,
    coverUrl: getCoverUrl(row.cover_blob_name, req),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      firstName: row.author_first_name,
      lastName: row.author_last_name,
      bio: row.author_bio
    },
    genre: {
      id: row.genre_id,
      name: row.genre_name,
      description: row.genre_description
    }
  };
}

const BASE_SELECT_QUERY = `
  SELECT 
    b.id,
    b.title,
    b.author_id,
    b.genre_id,
    b.year,
    b.status,
    b.description,
    b.cover_blob_name,
    b.created_at,
    b.updated_at,
    a.first_name AS author_first_name,
    a.last_name AS author_last_name,
    a.bio AS author_bio,
    g.name AS genre_name,
    g.description AS genre_description
  FROM books b
  JOIN authors a ON b.author_id = a.id
  JOIN genres g ON b.genre_id = g.id
`;

export async function getBooks(req, res, next) {
  try {
    const { genreId, authorId, status, search } = req.query;
    const conditions = [];
    const values = [];

    if (genreId) {
      values.push(parseInt(genreId, 10));
      conditions.push(`b.genre_id = $${values.length}`);
    }

    if (authorId) {
      values.push(parseInt(authorId, 10));
      conditions.push(`b.author_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`b.status = $${values.length}`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(`(
        b.title ILIKE $${idx} OR 
        b.description ILIKE $${idx} OR 
        a.first_name ILIKE $${idx} OR 
        a.last_name ILIKE $${idx} OR 
        g.name ILIKE $${idx}
      )`);
    }

    let sql = BASE_SELECT_QUERY;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(sql, values);
    const books = result.rows.map(row => formatBookRow(row, req));
    res.json(books);
  } catch (err) {
    next(err);
  }
}

export async function getBookById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${BASE_SELECT_QUERY} WHERE b.id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' });
    }

    res.json(formatBookRow(result.rows[0], req));
  } catch (err) {
    next(err);
  }
}

export async function createBook(req, res, next) {
  let uploadedBlobName = null;
  try {
    const validated = createBookSchema.parse(req.body);

    if (req.file) {
      uploadedBlobName = await uploadCoverBlob(req.file);
    }

    const insertSql = `
      INSERT INTO books (title, author_id, genre_id, year, status, description, cover_blob_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const insertRes = await pool.query(insertSql, [
      validated.title,
      validated.authorId,
      validated.genreId,
      validated.year,
      validated.status,
      validated.description || null,
      uploadedBlobName
    ]);

    const createdId = insertRes.rows[0].id;
    const selectRes = await pool.query(`${BASE_SELECT_QUERY} WHERE b.id = $1`, [createdId]);

    res.status(201).json(formatBookRow(selectRes.rows[0], req));
  } catch (err) {
    if (uploadedBlobName) {
      await deleteCoverBlob(uploadedBlobName);
    }
    next(err);
  }
}

export async function updateBook(req, res, next) {
  let newUploadedBlobName = null;
  try {
    const { id } = req.params;
    const validated = updateBookSchema.parse(req.body);

    const checkRes = await pool.query(`SELECT id, cover_blob_name FROM books WHERE id = $1`, [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' });
    }

    const currentCover = checkRes.rows[0].cover_blob_name;

    if (req.file) {
      newUploadedBlobName = await uploadCoverBlob(req.file);
    }

    const updateFields = [];
    const values = [];

    if (validated.title !== undefined) {
      values.push(validated.title);
      updateFields.push(`title = $${values.length}`);
    }
    if (validated.authorId !== undefined) {
      values.push(validated.authorId);
      updateFields.push(`author_id = $${values.length}`);
    }
    if (validated.genreId !== undefined) {
      values.push(validated.genreId);
      updateFields.push(`genre_id = $${values.length}`);
    }
    if (validated.year !== undefined) {
      values.push(validated.year);
      updateFields.push(`year = $${values.length}`);
    }
    if (validated.status !== undefined) {
      values.push(validated.status);
      updateFields.push(`status = $${values.length}`);
    }
    if (validated.description !== undefined) {
      values.push(validated.description);
      updateFields.push(`description = $${values.length}`);
    }
    if (newUploadedBlobName) {
      values.push(newUploadedBlobName);
      updateFields.push(`cover_blob_name = $${values.length}`);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING id`;

    await pool.query(sql, values);

    if (newUploadedBlobName && currentCover) {
      await deleteCoverBlob(currentCover);
    }

    const selectRes = await pool.query(`${BASE_SELECT_QUERY} WHERE b.id = $1`, [id]);
    res.json(formatBookRow(selectRes.rows[0], req));
  } catch (err) {
    if (newUploadedBlobName) {
      await deleteCoverBlob(newUploadedBlobName);
    }
    next(err);
  }
}

export async function updateBookStatus(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateStatusSchema.parse(req.body);

    const result = await pool.query(`
      UPDATE books 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id
    `, [validated.status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' });
    }

    const selectRes = await pool.query(`${BASE_SELECT_QUERY} WHERE b.id = $1`, [id]);
    res.json(formatBookRow(selectRes.rows[0], req));
  } catch (err) {
    next(err);
  }
}

export async function deleteBook(req, res, next) {
  try {
    const { id } = req.params;

    const checkRes = await pool.query(`SELECT cover_blob_name FROM books WHERE id = $1`, [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Книга не найдена' });
    }

    const coverBlobName = checkRes.rows[0].cover_blob_name;

    await pool.query(`DELETE FROM books WHERE id = $1`, [id]);

    if (coverBlobName) {
      await deleteCoverBlob(coverBlobName);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function streamBookCover(req, res, next) {
  try {
    const { blobName } = req.params;
    const { stream, contentType, contentLength } = await downloadCoverBlobStream(blobName);

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    stream.pipe(res);
  } catch (err) {
    console.warn(`[Storage] Blob not found or stream error: ${err.message}`);
    res.status(404).json({ message: 'Обложка не найдена' });
  }
}
