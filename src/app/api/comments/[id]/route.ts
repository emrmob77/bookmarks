import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Yorum güncelleme
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Yorum içeriği gereklidir' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Yorumun var olduğunu ve kullanıcıya ait olduğunu kontrol et
      const [comments] = await connection.query(
        'SELECT * FROM comments WHERE id = ? AND user_id = ?',
        [id, session.user.id]
      ) as [any[], any];

      if (!comments.length) {
        return NextResponse.json(
          { error: 'Yorum bulunamadı veya düzenleme yetkiniz yok' },
          { status: 404 }
        );
      }

      await connection.query(
        'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, id]
      );

      // Güncellenmiş yorumu getir
      const [updatedComments] = await connection.query(
        `SELECT c.*, u.username 
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [id]
      ) as [any[], any];

      return NextResponse.json(updatedComments[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Yorum güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Yorum güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Yorum silme
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const connection = await pool.getConnection();
    try {
      // Yorumun var olduğunu ve kullanıcıya ait olduğunu kontrol et
      const [comments] = await connection.query(
        'SELECT * FROM comments WHERE id = ? AND user_id = ?',
        [id, session.user.id]
      ) as [any[], any];

      if (!comments.length) {
        return NextResponse.json(
          { error: 'Yorum bulunamadı veya silme yetkiniz yok' },
          { status: 404 }
        );
      }

      // Alt yorumları da sil
      await connection.query(
        'DELETE FROM comments WHERE id = ? OR parent_id = ?',
        [id, id]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Yorum silinirken hata:', error);
    return NextResponse.json(
      { error: 'Yorum silinirken hata oluştu' },
      { status: 500 }
    );
  }
} 