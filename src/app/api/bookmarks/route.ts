import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Eğer şifre varsa buraya ekleyin
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 5, // Bağlantı limitini düşürüyoruz
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Bağlantı havuzunu temizlemek için bir fonksiyon
async function cleanupPool() {
  try {
    await pool.end();
  } catch (error) {
    console.error('Havuz temizleme hatası:', error);
  }
}

// Uygulama kapatıldığında havuzu temizle
process.on('SIGTERM', cleanupPool);
process.on('SIGINT', cleanupPool);

// Bookmark ekleme
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      // Kullanıcının onaylı olup olmadığını kontrol et
      const [users] = await connection.query(
        'SELECT is_approved, max_bookmarks FROM users WHERE id = ?',
        [session.user.id]
      ) as [any[], any];

      const user = users[0];
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.is_approved) {
        return NextResponse.json(
          { error: 'Your account is not approved yet. Please wait for admin approval.' },
          { status: 403 }
        );
      }

      // Kullanıcının bookmark limitini kontrol et
      const [bookmarkCount] = await connection.query(
        'SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?',
        [session.user.id]
      ) as [any[], any];

      if (bookmarkCount[0].count >= user.max_bookmarks) {
        return NextResponse.json(
          { error: 'You have reached your bookmark limit. Please upgrade to premium for more bookmarks.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { url, title, description, isPublic, tags } = body;

      // Bookmark ekle
      const bookmarkId = uuidv4();
      await connection.query(
        'INSERT INTO bookmarks (id, url, title, description, is_public, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [bookmarkId, url, title, description || null, Boolean(isPublic), session.user.id]
      );

      // Etiketleri ekle
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Önce tag'in var olup olmadığını kontrol et
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
            [bookmarkId, tagId]
          );
        }
      }

      // Eklenen bookmark'ı getir
      const [bookmarks] = await connection.query(
        `SELECT 
          b.*,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          COUNT(DISTINCT f.id) as favorite_count,
          u.username
        FROM bookmarks b
        LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN favorites f ON b.id = f.bookmark_id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
        GROUP BY b.id`,
        [bookmarkId]
      ) as [any[], any];

      const bookmark = bookmarks[0];
      const formattedBookmark = {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        isPublic: Boolean(bookmark.is_public),
        isPinned: Boolean(bookmark.is_pinned),
        isFavorite: false,
        favoriteCount: Number(bookmark.favorite_count) || 0,
        userId: bookmark.user_id,
        username: bookmark.username,
        createdAt: bookmark.created_at.toISOString(),
        updatedAt: bookmark.updated_at?.toISOString(),
        tags: bookmark.tags ? bookmark.tags.split(',').filter(Boolean) : [],
        comments: []
      };

      return NextResponse.json(formattedBookmark);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

// Bookmarkları getirme
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      const tag = searchParams.get('tag');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      // Test sorgusu
      await connection.query('SELECT 1');
      console.log('Veritabanı bağlantısı başarılı');

      let query = `
        SELECT 
          b.*,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          COUNT(DISTINCT f2.id) as favorite_count,
          COUNT(DISTINCT c.id) as comment_count,
          EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND bookmark_id = b.id) as is_favorited,
          u.username
        FROM bookmarks b
      `;

      let queryParams: any[] = [session.user.id];
      let whereConditions: string[] = [];

      // Favori sorgusu için JOIN'leri değiştir
      if (searchParams.get('favorites') === 'true') {
        query = `
          SELECT 
            b.*,
            GROUP_CONCAT(DISTINCT t.name) as tags,
            COUNT(DISTINCT f2.id) as favorite_count,
            COUNT(DISTINCT c.id) as comment_count,
            TRUE as is_favorited,
            u.username
          FROM bookmarks b
          INNER JOIN favorites f ON b.id = f.bookmark_id AND f.user_id = ?
          LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
          LEFT JOIN tags t ON bt.tag_id = t.id
          LEFT JOIN favorites f2 ON b.id = f2.bookmark_id
          LEFT JOIN comments c ON b.id = c.bookmark_id
          LEFT JOIN users u ON b.user_id = u.id
        `;
        queryParams = [session.user.id];
        whereConditions = [];
      } else {
        query += `
          LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
          LEFT JOIN tags t ON bt.tag_id = t.id
          LEFT JOIN favorites f2 ON b.id = f2.bookmark_id
          LEFT JOIN comments c ON b.id = c.bookmark_id
          LEFT JOIN users u ON b.user_id = u.id
        `;
      }

      if (userId) {
        whereConditions.push('b.user_id = ?');
        queryParams.push(userId);
      }

      if (tag) {
        whereConditions.push('t.name = ?');
        queryParams.push(tag);
      }

      if (search) {
        whereConditions.push('(b.title LIKE ? OR b.description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Sadece public bookmarkları veya kullanıcının kendi bookmarklarını göster
      whereConditions.push('(b.is_public = TRUE OR b.user_id = ?)');
      queryParams.push(session.user.id);

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ' GROUP BY b.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      console.log('SQL Query:', query);
      console.log('Query Params:', queryParams);

      const [bookmarks] = await connection.query(query, queryParams) as [any[], any];
      console.log('Yüklenen bookmark sayısı:', bookmarks.length);

      // Kullanıcı bilgilerini al
      const userIds = [...new Set(bookmarks.map((b: any) => b.user_id))];
      const [users] = await connection.query(
        'SELECT id, username FROM users WHERE id IN (?)',
        [userIds]
      ) as [any[], any];

      const userMap = new Map(users.map((u: any) => [u.id, u]));

      // Her bir bookmark için kullanıcı adını ekle ve arayüze uygun formata dönüştür
      const formattedBookmarks = await Promise.all(bookmarks.map(async (b: any) => {
        // Yorumları getir
        const [comments] = await connection.query(
          `SELECT 
            c.*,
            u.username
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.bookmark_id = ?
          ORDER BY c.created_at DESC`,
          [b.id]
        ) as [any[], any];

        const formattedComments = comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          username: comment.username,
          createdAt: comment.created_at.toISOString(),
          updatedAt: comment.updated_at?.toISOString(),
          bookmarkId: comment.bookmark_id
        }));

        return {
          id: b.id,
          url: b.url,
          title: b.title,
          description: b.description,
          image: b.image_url,
          tags: b.tags ? b.tags.split(',').filter(Boolean) : [],
          isPublic: Boolean(b.is_public),
          isPinned: Boolean(b.is_pinned),
          isFavorite: Boolean(b.is_favorited),
          favoriteCount: Number(b.favorite_count) || 0,
          userId: b.user_id,
          username: userMap.get(b.user_id)?.username || 'Unknown User',
          createdAt: b.created_at.toISOString(),
          updatedAt: b.updated_at?.toISOString(),
          viewCount: Number(b.view_count) || 0,
          commentCount: Number(b.comment_count) || 0,
          comments: formattedComments
        };
      }));

      // Toplam sayfa sayısını hesapla
      const [totalCount] = await connection.query(
        `SELECT COUNT(DISTINCT b.id) as total FROM bookmarks b 
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id 
         LEFT JOIN tags t ON bt.tag_id = t.id 
         WHERE ${whereConditions.join(' AND ')}`,
        queryParams.slice(0, -2)
      ) as [any[], any];

      const totalPages = Math.ceil(totalCount[0].total / limit);

      return NextResponse.json({
        bookmarks: formattedBookmarks,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount[0].total
        }
      });
    } catch (error) {
      console.error('Veritabanı sorgusu hatası:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks from database' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Oturum kontrolü hatası:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// Bookmark güncelleme
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Oturum açmanız gerekiyor' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
      const updateData = await req.json();
      const { id, tags } = updateData;
      
      if (!id) {
        return NextResponse.json({ message: 'Bookmark ID gerekli' }, { status: 400 });
      }

      // Bookmark'ın kullanıcıya ait olduğunu kontrol et
      const [bookmarks] = await connection.execute(
        'SELECT user_id FROM bookmarks WHERE id = ?',
        [id]
      ) as [any[], any];

      if (bookmarks.length === 0) {
        return NextResponse.json({ message: 'Bookmark bulunamadı' }, { status: 404 });
      }

      if (bookmarks[0].user_id !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Bu işlem için yetkiniz yok' }, { status: 403 });
      }
      
      // Temel alanları güncelle
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updateData.title);
      }
      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updateData.description);
      }
      if (updateData.url !== undefined) {
        updateFields.push('url = ?');
        updateValues.push(updateData.url);
      }
      if (updateData.isPublic !== undefined) {
        updateFields.push('is_public = ?');
        updateValues.push(updateData.isPublic);
      }
      if (updateData.is_pinned !== undefined) {
        updateFields.push('is_pinned = ?');
        updateValues.push(updateData.is_pinned);
      }

      // Güncelleme zamanını ekle
      updateFields.push('updated_at = NOW()');

      // ID'yi en son ekle
      updateValues.push(id);

      if (updateFields.length > 0) {
        await connection.execute(
          `UPDATE bookmarks SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Tag'leri güncelle
      if (tags !== undefined) {
        // Mevcut etiketleri sil
        await connection.query(
          'DELETE FROM bookmark_tags WHERE bookmark_id = ?',
          [id]
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
                [id, tagId]
              );
            } catch (error) {
              console.error(`Tag işlemi hatası (${tagName}):`, error);
              // Tag işlemi başarısız olsa bile diğer taglere devam et
              continue;
            }
          }
        }
      }

      // Güncellenmiş bookmark'ı getir
      const [updatedBookmark] = await connection.execute(
        `SELECT b.*, GROUP_CONCAT(t.name) as tags
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.id = ?
         GROUP BY b.id`,
        [id]
      ) as [any[], any];

      if (!updatedBookmark[0]) {
        return NextResponse.json({ message: 'Güncellenmiş bookmark bulunamadı' }, { status: 404 });
      }

      const bookmark = updatedBookmark[0];
      bookmark.tags = bookmark.tags ? bookmark.tags.split(',') : [];
      bookmark.isPinned = Boolean(bookmark.is_pinned);
      delete bookmark.is_pinned;

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

// Bookmark silme
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Kullanıcının onaylı olup olmadığını kontrol et
      if (!session.user.isApproved) {
        return NextResponse.json(
          { error: 'Your account is not approved yet. Please wait for admin approval.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const bookmarkId = searchParams.get('id');

      if (!bookmarkId) {
        return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
      }

      const connection = await pool.getConnection();
      
      try {
        // Bookmark'ın kullanıcıya ait olduğunu kontrol et
        const [bookmarks] = await connection.query(
          'SELECT user_id FROM bookmarks WHERE id = ?',
          [bookmarkId]
        ) as [any[], any];

        if (!bookmarks.length) {
          return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
        }

        if (bookmarks[0].user_id !== session.user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Bookmark'ı sil (ilişkili kayıtlar CASCADE ile silinecek)
        await connection.query('DELETE FROM bookmarks WHERE id = ?', [bookmarkId]);

        return NextResponse.json({ success: true });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      return NextResponse.json(
        { error: 'Failed to delete bookmark' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
