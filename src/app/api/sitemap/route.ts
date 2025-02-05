// Bu dosya artık kullanılmayacak 
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pages = ['', '/signin', '/signup', '/dashboard', '/settings'];
  
  // Dinamik sayfaları ekle
  const bookmarksDir = path.join(process.cwd(), 'public', 'bookmarks');
  if (fs.existsSync(bookmarksDir)) {
    const bookmarkFiles = fs.readdirSync(bookmarksDir);
    const bookmarkSlugs = bookmarkFiles
      .filter(file => file.endsWith('.json'))
      .map(file => `/bookmark/${file.replace('.json', '')}`);
    pages.push(...bookmarkSlugs);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map(page => `
          <url>
            <loc>${baseUrl}${page}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>daily</changefreq>
            <priority>${page === '' ? '1.0' : '0.8'}</priority>
          </url>
        `)
        .join('')}
    </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}