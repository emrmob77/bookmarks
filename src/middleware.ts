import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // robots.txt isteği için
  if (request.nextUrl.pathname === '/robots.txt') {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: ${request.nextUrl.origin}/sitemap.xml`;

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Diğer istekler için normal akışa devam et
  return NextResponse.next();
}

export const config = {
  matcher: ['/robots.txt']
} 