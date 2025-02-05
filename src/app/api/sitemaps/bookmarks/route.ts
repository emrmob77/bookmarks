import { NextResponse } from 'next/server';
import { getBookmarks } from '@/lib/storage';

export async function GET() {
  try {
    const bookmarks = await getBookmarks();
    const publicBookmarks = bookmarks.filter(bookmark => bookmark.isPublic);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${publicBookmarks.map(bookmark => `
    <url>
      <loc>${process.env.NEXT_PUBLIC_BASE_URL}/bookmark/${bookmark.id}</loc>
      <lastmod>${bookmark.updatedAt || bookmark.createdAt}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Bookmarks sitemap oluşturulurken hata:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}