import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Yer imleri site haritası
    xml += `  <sitemap>\n`;
    xml += `    <loc>${process.env.NEXT_PUBLIC_BASE_URL}/api/sitemaps/bookmarks</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    // Kullanıcılar site haritası
    xml += `  <sitemap>\n`;
    xml += `    <loc>${process.env.NEXT_PUBLIC_BASE_URL}/api/sitemaps/users</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    // Etiketler site haritası
    xml += `  <sitemap>\n`;
    xml += `    <loc>${process.env.NEXT_PUBLIC_BASE_URL}/api/sitemaps/tags</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    xml += '</sitemapindex>';
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('sitemap.xml oluşturulurken hata:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
} 