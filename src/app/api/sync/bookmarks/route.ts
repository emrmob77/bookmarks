import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Veri dizinini oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const bookmarks = await request.json();
    const filePath = path.join(DATA_DIR, 'bookmarks.json');
    
    fs.writeFileSync(filePath, JSON.stringify(bookmarks, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Yer imleri senkronize edilirken hata:', error);
    return NextResponse.json({ success: false, error: 'Senkronizasyon hatası' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const filePath = path.join(DATA_DIR, 'bookmarks.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Yer imleri okunurken hata:', error);
    return NextResponse.json([], { status: 500 });
  }
} 