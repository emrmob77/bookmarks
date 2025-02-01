export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  createdAt: string;
  isAdmin?: boolean;
  role: 'user' | 'admin';
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
  image: string;
  tags: string[];
  isPublic: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
  favoriteCount?: number;
  userId: string;
  username: string;
  createdAt: string;
  comments?: Array<{
    id: string;
    text: string;
    userId: string;
    username: string;
    createdAt: string;
  }>;
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
  id?: string;
  title: string;
  url: string;
  description?: string;
  image?: string;
  tags: string[];
  isPublic: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
  favoriteCount?: number;
  userId?: string;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: Array<{
    id: string;
    text: string;
    userId: string;
    username: string;
    createdAt: string;
  }>;
} 