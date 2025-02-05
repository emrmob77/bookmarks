import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Favoriye ekleme/çıkarma
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookmarkId } = body;

    const connection = await pool.getConnection();
    
    try {
      // Bookmark'ın var olduğunu ve public olduğunu kontrol et
      const [bookmarks] = await connection.query(
        'SELECT id, user_id, is_public FROM bookmarks WHERE id = ?',
        [bookmarkId]
      ) as [any[], any];

      if (!bookmarks.length) {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
      }

      const bookmark = bookmarks[0];
      if (!bookmark.is_public && bookmark.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Favoride var mı kontrol et
      const [favorites] = await connection.query(
        'SELECT id FROM favorites WHERE user_id = ? AND bookmark_id = ?',
        [session.user.id, bookmarkId]
      ) as [any[], any];

      // Toplam favori sayısını hesapla
      const [favoriteCount] = await connection.query(
        'SELECT COUNT(*) as count FROM favorites WHERE bookmark_id = ?',
        [bookmarkId]
      ) as [any[], any];

      let action: 'added' | 'removed';

      if (favorites.length > 0) {
        // Favoriden çıkar
        await connection.query(
          'DELETE FROM favorites WHERE id = ?',
          [favorites[0].id]
        );
        await connection.query(
          'UPDATE bookmarks SET favorite_count = ? WHERE id = ?',
          [Math.max(0, favoriteCount[0].count - 1), bookmarkId]
        );
        action = 'removed';
      } else {
        // Favoriye ekle
        const favoriteId = uuidv4();
        await connection.query(
          'INSERT INTO favorites (id, user_id, bookmark_id) VALUES (?, ?, ?)',
          [favoriteId, session.user.id, bookmarkId]
        );
        await connection.query(
          'UPDATE bookmarks SET favorite_count = ? WHERE id = ?',
          [favoriteCount[0].count + 1, bookmarkId]
        );
        action = 'added';
      }

      // Güncel favori sayısını al
      const [updatedBookmark] = await connection.query(
        'SELECT favorite_count FROM bookmarks WHERE id = ?',
        [bookmarkId]
      ) as [any[], any];

      return NextResponse.json({ 
        success: true, 
        action,
        favoriteCount: updatedBookmark[0].favorite_count 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
