import { Bookmark } from '@/types';

const BOOKMARKS_KEY = 'bookmarks';

export const getBookmarks = (): Bookmark[] => {
  if (typeof window === 'undefined') return [];
  
  const bookmarksJson = localStorage.getItem(BOOKMARKS_KEY);
  if (!bookmarksJson) return [];

  try {
    const bookmarks = JSON.parse(bookmarksJson);
    return bookmarks.map((bookmark: any) => ({
      ...bookmark,
      comments: bookmark.comments || [],
      favoriteCount: bookmark.favoriteCount || 0
    }));
  } catch (error) {
    console.error('Error parsing bookmarks:', error);
    return [];
  }
};

export const saveBookmarks = (bookmarks: Bookmark[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const getAllTags = (): string[] => {
  const bookmarks = getBookmarks();
  const tagSet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet);
}; 