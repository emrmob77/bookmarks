import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const savedSettings = localStorage.getItem('seoSettings');
    let robotsTxt = 'User-agent: *\nAllow: /';

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      robotsTxt = settings.robotsTxt;
    }

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