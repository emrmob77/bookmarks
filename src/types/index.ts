export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  isAdmin?: boolean;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  createdAt: string;
  settings?: {
    isApproved?: boolean;
    isPremium?: boolean;
    maxBookmarks?: number;
  };
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  tags: string[];
  isPublic: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  favoriteCount: number;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  commentCount?: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username: string;
  bookmarkId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookmarkMetadata {
  title: string;
  description: string;
  image: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  bookmarkCount: number;
  createdAt: string;
}

export interface NewBookmark {
  url: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  isPublic: boolean;
  userId: string;
  username: string;
}