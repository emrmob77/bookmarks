import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Eğer şifre varsa buraya ekleyin
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Profil bilgilerini getir
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        `SELECT username, email, bio, website, twitter, github 
         FROM users WHERE id = ?`,
        [session.user.id]
      ) as [any[], any];

      if (!users.length) {
        return NextResponse.json(
          { error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      return NextResponse.json(users[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profil bilgileri getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Profil bilgileri getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Profil bilgilerini güncelle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await req.json();
    const connection = await pool.getConnection();

    try {
      // Email ve kullanıcı adı benzersiz olmalı
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
        [profile.email, profile.username, session.user.id]
      ) as [any[], any];

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Bu email veya kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }

      // Profil bilgilerini güncelle
      await connection.query(
        `UPDATE users 
         SET username = ?,
             email = ?,
             bio = ?,
             website = ?,
             twitter = ?,
             github = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          profile.username,
          profile.email,
          profile.bio || null,
          profile.website || null,
          profile.twitter || null,
          profile.github || null,
          session.user.id
        ]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Profil güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
