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

// Bookmark detaylarını getirme
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [bookmarks] = await connection.query(
        `SELECT 
          b.*,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          COUNT(DISTINCT f.id) as favorite_count,
          EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND bookmark_id = b.id) as is_favorited
        FROM bookmarks b
        LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN favorites f ON b.id = f.bookmark_id
        WHERE b.id = ? AND (b.is_public = TRUE OR b.user_id = ?)
        GROUP BY b.id`,
        [session.user.id, params.id, session.user.id]
      ) as [any[], any];

      if (!bookmarks.length) {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
      }

      // Yorumları getir
      const [comments] = await connection.query(
        `SELECT 
          c.*,
          u.username as author_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.bookmark_id = ?
        ORDER BY c.created_at DESC`,
        [params.id]
      ) as [any[], any];

      const bookmark = {
        ...bookmarks[0],
        tags: bookmarks[0].tags ? bookmarks[0].tags.split(',') : [],
        is_favorited: !!bookmarks[0].is_favorited,
        comments
      };

      // Görüntülenme sayısını artır
      await connection.query(
        'UPDATE bookmarks SET view_count = view_count + 1 WHERE id = ?',
        [params.id]
      );

      return NextResponse.json(bookmark);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmark' },
      { status: 500 }
    );
  }
}

// Bookmark güncelleme
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, url, description, isPublic, tags } = body;

    const connection = await pool.getConnection();
    
    try {
      // Bookmark'ın kullanıcıya ait olduğunu kontrol et
      const [bookmarks] = await connection.query(
        'SELECT user_id FROM bookmarks WHERE id = ?',
        [params.id]
      ) as [any[], any];

      if (!bookmarks.length) {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
      }

      if (bookmarks[0].user_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Bookmark'ı güncelle
      console.log('API: Updating bookmark', {
        title,
        url,
        description,
        isPublic,
        id: params.id
      });

      await connection.query(
        'UPDATE bookmarks SET title = ?, url = ?, description = ?, is_public = ? WHERE id = ?',
        [title, url, description, isPublic === true ? 1 : 0, params.id]
      );

      // Mevcut etiketleri sil
      await connection.query(
        'DELETE FROM bookmark_tags WHERE bookmark_id = ?',
        [params.id]
      );

      // Yeni etiketleri ekle
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          try {
            // Önce mevcut etiketi kontrol et
            const [existingTags] = await connection.query(
              'SELECT id FROM tags WHERE name = ?',
              [tagName]
            ) as [any[], any];

            let tagId;
            if (existingTags.length > 0) {
              tagId = existingTags[0].id;
            } else {
              // Yeni tag oluştur
              tagId = uuidv4();
              const slug = tagName.toLowerCase().replace(/\s+/g, '-');
              await connection.query(
                'INSERT INTO tags (id, name, slug, created_by) VALUES (?, ?, ?, ?)',
                [tagId, tagName, slug, session.user.id]
              );
            }

            // Bookmark-tag ilişkisini ekle
            await connection.query(
              'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
              [params.id, tagId]
            );
          } catch (error) {
            console.error(`Tag işlemi hatası (${tagName}):`, error);
            // Tag işlemi başarısız olsa bile diğer taglere devam et
            continue;
          }
        }
      }

      // Güncellenmiş bookmark'ı getir
      const [updatedBookmark] = await connection.query(
        `SELECT b.*, GROUP_CONCAT(t.name) as tags
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.id = ?
         GROUP BY b.id`,
        [params.id]
      ) as [any[], any];

      if (!updatedBookmark.length) {
        throw new Error('Updated bookmark not found');
      }

      const bookmark = updatedBookmark[0];
      bookmark.tags = bookmark.tags ? bookmark.tags.split(',') : [];
      bookmark.isPublic = Boolean(bookmark.is_public);
      bookmark.isPinned = Boolean(bookmark.is_pinned);
      delete bookmark.is_public;
      delete bookmark.is_pinned;

      console.log('API: Returning updated bookmark:', bookmark);
      return NextResponse.json(bookmark);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bookmark güncelleme hatası:', error);
    return NextResponse.json(
      { message: 'Yer imi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
