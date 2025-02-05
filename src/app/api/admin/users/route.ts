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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug için eklendi

    if (!session?.user?.isAdmin) {
      console.log('Unauthorized access attempt:', session?.user); // Debug için eklendi
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connection = await pool.getConnection();
    console.log('Database connection established'); // Debug için eklendi

    try {
      const query = `SELECT 
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
      GROUP BY u.id`;

      console.log('Executing query:', query); // Debug için eklendi

      const [users] = await connection.query(query) as [any[], any];
      console.log('Query result:', users); // Debug için eklendi

      const formattedUsers = users.map(user => ({
        ...user,
        settings: {
          maxBookmarks: user.maxBookmarks || 10,
          isApproved: user.isApproved || false,
          isPremium: user.isPremium || false,
          premiumUntil: user.premiumUntil || null
        }
      }));

      console.log('Users fetched:', formattedUsers); // Debug için eklendi

      return NextResponse.json({ users: formattedUsers });
    } catch (error) {
      console.error('Database query error:', error); // Debug için eklendi
      throw error;
    } finally {
      connection.release();
      console.log('Database connection released'); // Debug için eklendi
    }
  } catch (error) {
    console.error('Error details:', error); // Debug için eklendi
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id, settings, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update user table
      if (settings) {
        await connection.query(
          `UPDATE users SET 
            is_approved = ?,
            is_premium = ?,
            premium_until = ?,
            max_bookmarks = ?
          WHERE id = ?`,
          [
            settings.isApproved,
            settings.isPremium,
            settings.premiumUntil,
            settings.maxBookmarks,
            id
          ]
        );
      }

      if (Object.keys(updateData).length > 0) {
        const updateFields = Object.entries(updateData)
          .map(([key, _]) => `${key} = ?`)
          .join(', ');

        const updateValues = [...Object.values(updateData), id];

        await connection.query(
          `UPDATE users SET ${updateFields} WHERE id = ?`,
          updateValues
        );
      }

      await connection.commit();

      const [updatedUsers] = await connection.query(
        `SELECT 
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
        GROUP BY u.id`,
        [id]
      ) as [any[], any];

      if (!updatedUsers.length) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const formattedUser = {
        ...updatedUsers[0],
        settings: {
          maxBookmarks: updatedUsers[0].maxBookmarks || 10,
          isApproved: updatedUsers[0].isApproved || false,
          isPremium: updatedUsers[0].isPremium || false,
          premiumUntil: updatedUsers[0].premiumUntil || null
        }
      };

      return NextResponse.json(formattedUser);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
