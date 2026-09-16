import { pool } from '../db/index.js';
import { createGenreSchema } from '../validators/genreValidator.js';

export async function getGenres(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id, name, description
      FROM genres
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createGenre(req, res, next) {
  try {
    const validated = createGenreSchema.parse(req.body);
    const result = await pool.query(`
      INSERT INTO genres (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
    `, [validated.name, validated.description || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
