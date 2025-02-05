import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const connection = await pool.getConnection();

    try {
      // Kullanıcı bilgilerini getir
      const [users] = await connection.query(
        `SELECT id, username, email, bio, website, twitter, github, created_at, is_approved 
         FROM users WHERE username = ?`,
        [username]
      ) as [any[], any];

      if (!users.length) {
        return NextResponse.json(
          { error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      const user = users[0];

      // Kullanıcının istatistiklerini getir
      const [bookmarkStats] = await connection.query(
        `SELECT 
          COUNT(*) as totalBookmarks,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as publicBookmarks,
          SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as privateBookmarks
         FROM bookmarks 
         WHERE user_id = ?`,
        [user.id]
      ) as [any[], any];

      // Favori sayısını getir
      const [favoriteStats] = await connection.query(
        `SELECT COUNT(*) as favorites
         FROM favorites 
         WHERE user_id = ?`,
        [user.id]
      ) as [any[], any];

      // Yorum sayısını getir
      const [commentStats] = await connection.query(
        `SELECT COUNT(*) as totalComments
         FROM comments 
         WHERE user_id = ?`,
        [user.id]
      ) as [any[], any];

      return NextResponse.json({
        profile: {
          username: user.username,
          email: user.email,
          bio: user.bio,
          website: user.website,
          twitter: user.twitter,
          github: user.github,
          createdAt: user.created_at,
          isApproved: user.is_approved === 1
        },
        stats: {
          totalBookmarks: bookmarkStats[0].totalBookmarks,
          publicBookmarks: bookmarkStats[0].publicBookmarks,
          privateBookmarks: bookmarkStats[0].privateBookmarks,
          favorites: favoriteStats[0].favorites,
          totalComments: commentStats[0].totalComments
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Kullanıcı bilgileri getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı bilgileri getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}
