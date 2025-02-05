import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'bookmark_db',
  waitForConnections: true,
  connectionLimit: 5,
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gereklidir');
        }

        let connection;
        try {
          connection = await pool.getConnection();
          
          const [users] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          ) as [any[], any];

          if (!users.length) {
            throw new Error('Geçersiz email veya şifre');
          }

          const user = users[0];
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValidPassword) {
            throw new Error('Geçersiz email veya şifre');
          }

          if (!user.is_approved) {
            throw new Error('Hesabınız henüz onaylanmamış');
          }

          // Son giriș zamanını güncelle
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await connection.query(
            'UPDATE users SET last_login = ? WHERE id = ?',
            [now, user.id]
          );

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isAdmin: user.role === 'admin',
            createdAt: user.created_at,
            isApproved: user.is_approved === 1,
            maxBookmarks: user.max_bookmarks ?? 100
          };
        } catch (error: any) {
          console.error('Kimlik doğrulama hatası:', error);
          throw new Error(error.message || 'Giriş yapılırken bir hata oluştu');
        } finally {
          if (connection) connection.release();
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('User data in JWT callback:', user);
        token.id = user.id;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.username = user.username;
        token.createdAt = user.createdAt;
        token.isApproved = user.isApproved;
        token.maxBookmarks = user.maxBookmarks;
        console.log('Token after update:', token);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        console.log('Token in session callback:', token);
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.createdAt = token.createdAt as string;
        session.user.isApproved = token.isApproved as boolean;
        session.user.maxBookmarks = token.maxBookmarks as number;
        console.log('Session after update:', session);
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
