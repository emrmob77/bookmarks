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

// Yorum ekleme
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookmarkId, content, parentId } = body;

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

      // Yorum ekle
      const commentId = uuidv4();
      await connection.query(
        'INSERT INTO comments (id, bookmark_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)',
        [commentId, bookmarkId, session.user.id, content, parentId || null]
      );

      // Yeni yorumu getir
      const [comments] = await connection.query(
        `SELECT 
          c.*,
          u.username as author_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?`,
        [commentId]
      ) as [any[], any];

      return NextResponse.json(comments[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// Yorum silme
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    
    try {
      // Yorumun kullanıcıya ait olduğunu kontrol et
      const [comments] = await connection.query(
        'SELECT user_id FROM comments WHERE id = ?',
        [commentId]
      ) as [any[], any];

      if (!comments.length) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      if (comments[0].user_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Yorumu sil (alt yorumlar CASCADE ile silinecek)
      await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
