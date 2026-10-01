import { getDatabase } from './database.js';

// Create dreams table if it doesn't exist
export async function initDatabase() {
  try {
    const db = await getDatabase();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS dreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dream_text TEXT NOT NULL,
        interpretation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
