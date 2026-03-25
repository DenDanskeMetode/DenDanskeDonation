import pool from './db.js';

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        from_user INTEGER NOT NULL,
        to_campaign INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        stripe_subscription_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user) REFERENCES users(id),
        FOREIGN KEY (to_campaign) REFERENCES campaigns(id)
      )
    `);
    await pool.query(`ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE`);
    await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE`);
    await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP DEFAULT NULL`);
    console.log('Migrations complete.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
