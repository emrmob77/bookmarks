import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const tags = await request.json();
    const tagsPath = path.join(process.cwd(), 'public', 'tags.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json({ success: false, error: 'Failed to update tags' }, { status: 500 });
  }
} 