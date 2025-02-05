import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /settings/

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`;

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('robots.txt yüklenirken hata:', error);
    return new NextResponse('User-agent: *\nAllow: /', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
} 