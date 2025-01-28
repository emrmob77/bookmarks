import { Bookmark } from '@/types';

const STORAGE_KEY = 'bookmarks';

export function getBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function getAllTags(): string[] {
  const bookmarks = getBookmarks();
  const tagSet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet);
} 