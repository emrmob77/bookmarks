const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    const password = 'admin123'; // değiştirin
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await client.query(`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email;
    `, ['admin', 'admin@example.com', passwordHash, true]);

    console.log('Admin user created:', result.rows[0]);
  } catch (error) {
    console.error('Failed to create admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin(); 