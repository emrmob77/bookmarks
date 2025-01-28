export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
  createdAt: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export interface BaseComment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Comment extends BaseComment {
  bookmarkId: string;
}

export interface BookmarkComment extends BaseComment {
  bookmark: {
    id: string;
    title: string;
    url: string;
    tags: string[];
    description?: string;
  };
}

export interface Bookmark {
  id: string;
  userId: string;
  username: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
  isOwner?: boolean;
  favoriteCount?: number;
  comments?: Comment[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  bookmarkCount?: number;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookmarks: number;
  totalTags: number;
  recentUsers: User[];
  popularTags: { name: string; count: number; }[];
}

export interface BookmarkMetadata {
  title: string;
  description: string;
  error?: string;
}

export type NewBookmark = Omit<Bookmark, 'id' | 'comments' | 'favoriteCount' | 'isPinned' | 'isFavorite' | 'isOwner' | 'createdAt'>; 