import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/signin') ||
                    req.nextUrl.pathname.startsWith('/signup');

  // robots.txt isteği için
  if (req.nextUrl.pathname === '/robots.txt') {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: ${req.nextUrl.origin}/sitemap.xml`;

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Public sayfalar için kontrol yok
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  // Auth sayfaları kontrolü
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Korumalı sayfalar için auth kontrolü
  if (!isAuth && req.nextUrl.pathname.startsWith('/dashboard')) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    
    return NextResponse.redirect(
      new URL(`/signin?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Admin sayfaları kontrolü
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const isAdmin = token?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // API rotaları kontrolü
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Public API rotaları
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/reset-password'
    ];

    if (publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // Diğer API rotaları için auth kontrolü
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/signin',
    '/signup',
    '/robots.txt',
    '/api/bookmarks/:path*',
    '/api/users/:path*',
    '/api/tags/:path*'
  ]
};