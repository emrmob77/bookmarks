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

// Ayarları getir
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT theme, language, notifications_enabled, email_notifications FROM users WHERE id = ?',
        [session.user.id]
      ) as [any[], any];

      if (!users.length) {
        return NextResponse.json(
          { error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      const user = users[0];
      return NextResponse.json({
        theme: user.theme || 'light',
        language: user.language || 'tr',
        notifications: user.notifications_enabled === 1,
        emailNotifications: user.email_notifications === 1
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ayarlar getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Ayarlar getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Ayarları güncelle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await req.json();
    const connection = await pool.getConnection();

    try {
      await connection.query(
        `UPDATE users 
         SET theme = ?, 
             language = ?, 
             notifications_enabled = ?, 
             email_notifications = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          settings.theme,
          settings.language,
          settings.notifications ? 1 : 0,
          settings.emailNotifications ? 1 : 0,
          session.user.id
        ]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ayarlar güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Ayarlar güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}