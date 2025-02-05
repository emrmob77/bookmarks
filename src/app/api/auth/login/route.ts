import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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
    const { email, password } = await req.json();
    console.log('Login attempt for email:', email);

    // Gerekli alanları kontrol et
    if (!email || !password) {
      const error = 'Email and password are required';
      console.log('Login error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Kullanıcıyı e-posta ile bul
      const [users] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as [any[], any];

      console.log('Database query completed. Found users:', users.length);

      if (!Array.isArray(users) || users.length === 0) {
        const error = 'User not found with email: ' + email;
        console.log('Login error:', error);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const user = users[0];
      console.log('Found user:', { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        is_approved: user.is_approved,
        all_data: user 
      });

      // Şifreyi kontrol et
      console.log('Comparing passwords...');
      console.log('Input password:', password);
      console.log('Stored hash:', user.password_hash);
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Password validation result:', isValidPassword);

      if (!isValidPassword) {
        const error = 'Invalid password for user: ' + email;
        console.log('Login error:', error);
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        );
      }

      // Son giriş zamanını güncelle
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await connection.query(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [now, user.id]
      );

      // Kullanıcı bilgilerini döndür (şifre hariç)
      const { password_hash, ...userWithoutPassword } = user;

      // isApproved alanını doğru formatta gönder
      const formattedUser = {
        ...userWithoutPassword,
        isApproved: user.is_approved === 1
      };

      console.log('Login successful for user:', formattedUser);

      return NextResponse.json(
        { 
          message: 'Login successful',
          user: formattedUser
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
