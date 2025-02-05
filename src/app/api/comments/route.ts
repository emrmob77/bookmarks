import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bookmark_db',
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
    const { bookmarkId, content, parentId, clientCommentId } = body;

    if (!bookmarkId || !content || !clientCommentId) {
      return NextResponse.json(
        { error: 'Bookmark ID, yorum içeriği ve clientCommentId gereklidir' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Eğer clientCommentId varsa, aynı yorum daha önce eklenmiş mi kontrol et
      const [existingComments] = await connection.query(
        `SELECT c.*, u.username 
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.client_comment_id = ?`,
        [clientCommentId]
      ) as [any[], any];

      if (existingComments.length > 0) {
        // Aynı yorum daha önce eklenmiş, mevcut yorumu döndür
        connection.release();
        return NextResponse.json(existingComments[0]);
      }

      // Bookmark'ın var olduğunu kontrol et
      const [bookmarks] = await connection.query(
        'SELECT id FROM bookmarks WHERE id = ?',
        [bookmarkId]
      ) as [any[], any];

      if (!bookmarks.length) {
        return NextResponse.json(
          { error: 'Bookmark bulunamadı' },
          { status: 404 }
        );
      }

      // Eğer parentId varsa, parent yorumun var olduğunu kontrol et
      if (parentId) {
        const [parentComments] = await connection.query(
          'SELECT id FROM comments WHERE id = ?',
          [parentId]
        ) as [any[], any];

        if (!parentComments.length) {
          return NextResponse.json(
            { error: 'Parent yorum bulunamadı' },
            { status: 404 }
          );
        }
      }

      const commentId = uuidv4();
      
      console.log('Yorum ekleniyor:', {
        commentId,
        bookmarkId,
        userId: session.user.id,
        content,
        parentId
      });

      await connection.query(
        `INSERT INTO comments (id, bookmark_id, user_id, content, parent_id, client_comment_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [commentId, bookmarkId, session.user.id, content, parentId || null, clientCommentId]
      );

      // Eklenen yorumu getir
      const [comments] = await connection.query(
        `SELECT c.*, u.username 
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [commentId]
      ) as [any[], any];

      console.log('Eklenen yorum:', comments[0]);

      return NextResponse.json(comments[0]);
    } catch (error) {
      console.error('Yorum eklenirken SQL hatası:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Yorum eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Yorum eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Yorumları getir
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookmarkId = searchParams.get('bookmarkId');
    const parentId = searchParams.get('parentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID gereklidir' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      let query = `
        SELECT 
          c.*,
          u.username,
          (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
        FROM comments c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.bookmark_id = ?
      `;
      const queryParams: any[] = [bookmarkId];

      if (parentId) {
        query += ' AND c.parent_id = ?';
        queryParams.push(parentId);
      } else {
        query += ' AND c.parent_id IS NULL';
      }

      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      const [comments] = await connection.query(query, queryParams) as [any[], any];

      // Toplam yorum sayısını getir
      const [totalCount] = await connection.query(
        'SELECT COUNT(*) as total FROM comments WHERE bookmark_id = ? AND parent_id IS NULL',
        [bookmarkId]
      ) as [any[], any];

      const totalPages = Math.ceil(totalCount[0].total / limit);

      return NextResponse.json({
        comments: comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          userId: comment.user_id,
          username: comment.username,
          parentId: comment.parent_id,
          replyCount: Number(comment.reply_count),
          createdAt: comment.created_at.toISOString(),
          updatedAt: comment.updated_at?.toISOString()
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount[0].total
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Yorumlar getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Yorumlar getirilirken hata oluştu' },
      { status: 500 }
    );
  }
} 