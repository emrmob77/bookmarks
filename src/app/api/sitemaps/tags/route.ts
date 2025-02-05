import { NextResponse } from 'next/server';
import { getBookmarks } from '@/lib/storage';

export async function GET() {
  try {
    const bookmarks = await getBookmarks();
    const tags = new Set<string>();

    // Tüm public bookmarkların taglerini topla
    bookmarks.forEach(bookmark => {
      if (bookmark.isPublic && bookmark.tags) {
        bookmark.tags.forEach(tag => tags.add(tag));
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Array.from(tags).map(tag => `
    <url>
      <loc>${process.env.NEXT_PUBLIC_BASE_URL}/tags/${encodeURIComponent(tag)}</loc>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Etiketler site haritası oluşturulurken hata:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}