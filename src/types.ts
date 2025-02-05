export interface User {
  id: string;
  email: string;
  username: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  avatar?: string;
  settings?: UserSettings;
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
  url: string;
  title: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt?: string;
  comments?: Comment[];
  favoriteCount?: number;
  isPinned?: boolean;
  isFavorite?: boolean;
  isOwner?: boolean;
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

export interface UserSettings {
  theme?: 'light' | 'dark';
  language?: string;
  emailNotifications?: boolean;
  isApproved?: boolean;
  isPremium?: boolean;
  isPublic?: boolean;
  maxBookmarks?: number;
}

export interface UserFavorite {
  bookmarkId: string;
  userId: string;
  createdAt: string;
  bookmarkData: Bookmark;
}

export type NewBookmark = Omit<Bookmark, 'id' | 'comments' | 'favoriteCount' | 'isPinned' | 'isFavorite' | 'isOwner' | 'createdAt'>;