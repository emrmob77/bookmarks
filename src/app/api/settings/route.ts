import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    const settingsPath = path.join(process.cwd(), 'public', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
} 