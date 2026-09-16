import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDatabase(maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] Attempting to connect to PostgreSQL (attempt ${attempt}/${maxRetries})...`);
      const client = await pool.connect();
      try {
        console.log('[DB] Connected successfully. Initializing schema...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await client.query(schemaSql);
        console.log('[DB] Schema and seed data initialized successfully.');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`[DB] Connection failed: ${err.message}`);
      if (attempt === maxRetries) {
        throw new Error(`[DB] Could not connect to database after ${maxRetries} attempts.`);
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}
