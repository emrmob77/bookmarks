import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// MySQL bağlantı havuzu oluştur
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = await req.json();

    // Gerekli alanları kontrol et
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password and username are required' },
        { status: 400 }
      );
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Email ve kullanıcı adının benzersiz olduğunu kontrol et
      const [existingUsers] = await connection.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Email or username already exists' },
          { status: 409 }
        );
      }

      // Şifreyi hashle
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Yeni kullanıcı oluştur
      const userId = uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await connection.query(
        `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', ?, ?)`,
        [userId, username, email, hashedPassword, now, now]
      );

      // Kullanıcı bilgilerini döndür (şifre hariç)
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      const user = rows[0];

      return NextResponse.json(
        { message: 'User registered successfully', user },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
