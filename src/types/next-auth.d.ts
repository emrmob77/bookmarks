import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    isAdmin: boolean;
    isApproved: boolean;
    createdAt: string;
    avatar?: string;
    maxBookmarks: number;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
      username: string;
      role: string;
      isAdmin: boolean;
      isApproved: boolean;
      createdAt: string;
      avatar?: string;
      maxBookmarks: number;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username: string;
    role: string;
    isAdmin: boolean;
    isApproved: boolean;
    createdAt: string;
    avatar?: string;
    maxBookmarks: number;
  }
}
