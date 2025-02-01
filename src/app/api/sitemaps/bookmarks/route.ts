import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET(request: Request) {
  try {
    const filePath = path.join(DATA_DIR, 'bookmarks.json');
    if (!fs.existsSync(filePath)) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const bookmarks = JSON.parse(data).filter((bookmark: any) => bookmark.isPublic);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    bookmarks.forEach((bookmark: any) => {
      xml += `  <url>\n`;
      xml += `    <loc>${new URL(request.url).origin}/bookmark/${bookmark.id}</loc>\n`;
      xml += `    <lastmod>${new Date(bookmark.updatedAt || bookmark.createdAt).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += '</urlset>';
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Yer imleri site haritası oluşturulurken hata:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
} 