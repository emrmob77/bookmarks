import { Bookmark } from '@/types';

const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// Senkronizasyon fonksiyonu
async function syncToServer(endpoint: string, data: any) {
  try {
    const response = await fetch(`/api/sync/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Senkronizasyon hatası: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`${endpoint} senkronizasyon hatası:`, error);
  }
}

export function getBookmarks() {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = localStorage.getItem('bookmarks');
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error('Yer imleri alınırken hata:', error);
    return [];
  }
}

export async function saveBookmarks(bookmarks: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    await syncToServer('bookmarks', bookmarks);
  } catch (error) {
    console.error('Yer imleri kaydedilirken hata:', error);
  }
}

export const getUserFavorites = (userId: string): any[] => {
  const key = `userFavorites_${userId}`;
  return storage.get<any[]>(key) || [];
};

export const saveUserFavorites = (userId: string, favorites: any[]): boolean => {
  const key = `userFavorites_${userId}`;
  return storage.set(key, favorites);
};

export const getSeoSettings = () => {
  return storage.get('seoSettings') || { robotsTxt: '', sitemapUrl: '' };
};

export const saveSeoSettings = (settings: { robotsTxt: string; sitemapUrl: string }): boolean => {
  return storage.set('seoSettings', settings);
};

export function getUsers() {
  if (typeof window === 'undefined') return [];
  try {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Kullanıcılar alınırken hata:', error);
    return [];
  }
}

export async function saveUsers(users: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('users', JSON.stringify(users));
    await syncToServer('users', users);
  } catch (error) {
    console.error('Kullanıcılar kaydedilirken hata:', error);
  }
}

export const getAllTags = (): string[] => {
  const bookmarks = getBookmarks();
  const tagSet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet);
};

export default storage; 