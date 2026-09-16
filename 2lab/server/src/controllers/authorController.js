import { pool } from '../db/index.js';
import { createAuthorSchema } from '../validators/authorValidator.js';

export async function getAuthors(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id, first_name AS "firstName", last_name AS "lastName", bio, created_at AS "createdAt"
      FROM authors
      ORDER BY last_name ASC, first_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createAuthor(req, res, next) {
  try {
    const validated = createAuthorSchema.parse(req.body);
    const result = await pool.query(`
      INSERT INTO authors (first_name, last_name, bio)
      VALUES ($1, $2, $3)
      RETURNING id, first_name AS "firstName", last_name AS "lastName", bio, created_at AS "createdAt"
    `, [validated.firstName, validated.lastName, validated.bio || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
