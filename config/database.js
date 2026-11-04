import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function getDatabase() {
  return getPool();
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

const db = {
  query: (...args) => getPool().query(...args),
  end: () => closeDatabase(),
  getDatabase,
  getPool,
  closeDatabase
};

export default db;
