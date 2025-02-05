import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// MySQL bağlantı havuzu oluştur
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // E-posta değişikliği varsa formatını kontrol et
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const connection = await pool.getConnection();

    try {
      // E-posta veya kullanıcı adı değişikliği varsa benzersizliği kontrol et
      if (updateData.email || updateData.username) {
        const [existingUsers] = await connection.query(
          'SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?',
          [updateData.email || '', updateData.username || '', id]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          return NextResponse.json(
            { error: 'Email or username already exists' },
            { status: 409 }
          );
        }
      }

      // Güncellenecek alanları ve değerlerini hazırla
      const updateFields = Object.entries(updateData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => `${key} = ?`);
      
      const updateValues = Object.entries(updateData)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value);

      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      // updated_at alanını da güncelle
      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));

      // Kullanıcı ID'sini değerler dizisine ekle
      updateValues.push(id);

      // Güncelleme sorgusunu oluştur ve çalıştır
      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await connection.query(updateQuery, updateValues);

      // Güncellenmiş kullanıcı bilgilerini getir
      const [updatedUsers] = await connection.query(
        'SELECT id, username, email, bio, website, twitter, github, role, is_approved, is_premium, premium_until, created_at, updated_at, last_login FROM users WHERE id = ?',
        [id]
      );

      if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Profile updated successfully',
          user: updatedUsers[0]
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
