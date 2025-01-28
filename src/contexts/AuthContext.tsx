'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Admin kullanıcısını kontrol et ve yoksa oluştur
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.length === 0) {
            const adminUser: User = {
              id: '1',
              email: 'admin@example.com',
              username: 'admin',
              isAdmin: true,
              createdAt: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify([adminUser]));
          }

          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const protectedRoutes = ['/dashboard', '/settings', '/admin'];
      if (protectedRoutes.some(route => pathname?.startsWith(route))) {
        if (!isAuthenticated) {
          router.push('/auth/login');
        } else if (pathname?.startsWith('/admin') && !user?.isAdmin) {
          router.push('/');
        }
      }
    }
  }, [isLoading, isAuthenticated, pathname, router, user]);

  const login = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find((u: User) => u.email === email);
      
      if (!foundUser) {
        throw new Error('User not found');
      }

      localStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
      setIsAuthenticated(true);
      router.push(foundUser.isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const newUser: User = {
        id: Date.now().toString(),
        email,
        username,
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      router.push('/dashboard');
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (user && typeof window !== 'undefined') {
      const updatedUser = { ...user, ...data };
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: User) => 
        u.id === user.id ? updatedUser : u
      );

      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (data.username && data.username !== user.username) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const updatedBookmarks = bookmarks.map((bookmark: any) => {
          if (bookmark.userId === user.id) {
            return { ...bookmark, username: data.username };
          }
          return bookmark;
        });
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
      }
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 