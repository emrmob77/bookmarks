import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/storage';

export async function GET() {
  try {
    const users = await getUsers();
    const publicUsers = users.filter(user => user.settings?.isPublic);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${publicUsers.map(user => `
    <url>
      <loc>${process.env.NEXT_PUBLIC_BASE_URL}/users/${encodeURIComponent(user.username)}</loc>
      <lastmod>${user.updatedAt || user.createdAt}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>
  `).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Users sitemap oluşturulurken hata:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}