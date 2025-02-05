import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Veritabanı şifrenizi buraya ekleyin
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    console.log('Received PATCH request for user ID:', params.id);
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.isAdmin) {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const data = await req.json();
    console.log('Request data:', data);

    // Kullanıcının var olup olmadığını kontrol et
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    ) as [any[], any];

    if (!existingUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Güncellenecek alanları ve değerlerini hazırla
    const updates: string[] = [];
    const values: any[] = [];

    if ('isApproved' in data) {
      updates.push('is_approved = ?');
      values.push(data.isApproved);
      console.log('Adding is_approved update:', data.isApproved);
    }

    if ('isPremium' in data) {
      updates.push('is_premium = ?');
      values.push(data.isPremium);
      console.log('Adding is_premium update:', data.isPremium);

      if (data.isPremium) {
        // MySQL datetime formatını doğrula
        let premiumUntil = data.premiumUntil;
        if (premiumUntil) {
          try {
            // Tarih formatını kontrol et
            if (!premiumUntil.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
              throw new Error('Invalid datetime format');
            }
            updates.push('premium_until = ?');
            values.push(premiumUntil);
          } catch (error) {
            console.error('Invalid premium_until date:', error);
            return NextResponse.json(
              { error: 'Invalid premium_until date format. Expected format: YYYY-MM-DD HH:mm:ss' },
              { status: 400 }
            );
          }
        } else {
          // Varsayılan olarak 30 gün sonrasını ayarla
          const defaultPremiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
          updates.push('premium_until = ?');
          values.push(defaultPremiumUntil);
        }
        
        updates.push('max_bookmarks = ?');
        values.push(100);
        console.log('Adding premium fields:', {
          premium_until: values[values.length - 2],
          max_bookmarks: 100
        });
      } else {
        updates.push('premium_until = NULL');
        updates.push('max_bookmarks = ?');
        values.push(10);
        console.log('Removing premium fields, setting max_bookmarks to 10');
      }
    }

    if ('maxBookmarks' in data && !('isPremium' in data)) {
      updates.push('max_bookmarks = ?');
      values.push(data.maxBookmarks);
      console.log('Adding max_bookmarks update:', data.maxBookmarks);
    }

    if (updates.length === 0) {
      console.log('No fields to update');
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Güncelleme sorgusunu oluştur
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    // ID'yi values dizisine ekle
    values.push(id);

    console.log('Update query:', updateQuery);
    console.log('Update values:', values);

    try {
      const [updateResult] = await connection.query(updateQuery, values);
      console.log('Update result:', updateResult);

      // Güncellenmiş kullanıcı bilgilerini getir
      const selectQuery = `
        SELECT 
          u.id,
          u.username as name,
          u.email,
          u.role,
          u.is_approved as isApproved,
          u.is_premium as isPremium,
          u.premium_until as premiumUntil,
          u.max_bookmarks as maxBookmarks,
          u.created_at as createdAt,
          u.updated_at as updatedAt,
          u.last_login as lastLogin,
          COUNT(b.id) as bookmarkCount
        FROM users u
        LEFT JOIN bookmarks b ON u.id = b.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `;

      const [updatedUser] = await connection.query(selectQuery, [id]) as [any[], any];
      console.log('Updated user data:', updatedUser[0]);

      if (!updatedUser.length) {
        throw new Error('User not found after update');
      }

      return NextResponse.json({ 
        user: updatedUser[0],
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Database error: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    connection.release();
    console.log('Database connection released');
  }
}
