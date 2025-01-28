import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface MetadataResponse {
  title: string;
  description: string;
  image: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarksBot/1.0; +http://example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get metadata
    const title = $('title').text() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="twitter:title"]').attr('content') || '';

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || '';

    const image = $('meta[property="og:image"]').attr('content') || 
                 $('meta[name="twitter:image"]').attr('content') || 
                 $('link[rel="icon"]').attr('href') || '';

    // Clean and validate the data
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    let cleanImage = image.trim();

    // If image is a relative URL, make it absolute
    if (cleanImage && !cleanImage.startsWith('http')) {
      try {
        const baseUrl = new URL(url);
        cleanImage = new URL(cleanImage, baseUrl.origin).toString();
      } catch (err) {
        console.error('Error processing image URL:', err);
        cleanImage = '';
      }
    }

    const metadata: MetadataResponse = {
      title: cleanTitle,
      description: cleanDescription,
      image: cleanImage,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    const errorResponse: MetadataResponse = {
      title: '',
      description: '',
      image: '',
      error: error instanceof Error ? error.message : 'Failed to fetch metadata'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}