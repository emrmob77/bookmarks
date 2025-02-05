import { NextResponse } from 'next/server';
import { User } from '@/types';

// Mock users data - gerçek uygulamada veritabanından gelecek
const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    isAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      isApproved: true,
      maxBookmarks: 1000,
      isPublic: true
    }
  },
  {
    id: '2',
    email: 'user@example.com',
    username: 'user',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      isApproved: true,
      maxBookmarks: 100,
      isPublic: false
    }
  }
];

export async function GET() {
  try {
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updatedUsers = await request.json();
    
    // Burada gerçek uygulamada veritabanı güncellemesi yapılacak
    // Şimdilik mock data'yı güncelliyoruz
    Object.assign(users, updatedUsers);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update users' },
      { status: 500 }
    );
  }
}
