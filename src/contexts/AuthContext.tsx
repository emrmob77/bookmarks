'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      const sessionUser = session.user as any;
      const user: User = {
        id: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.username,
        role: sessionUser.role || 'user',
        isAdmin: sessionUser.isAdmin || false,
        createdAt: sessionUser.createdAt || new Date().toISOString(),
        updatedAt: sessionUser.updatedAt || new Date().toISOString(),
        bio: sessionUser.bio,
        website: sessionUser.website,
        twitter: sessionUser.twitter,
        github: sessionUser.github,
        settings: {
          isApproved: sessionUser.isApproved || false,
          isPremium: sessionUser.settings?.isPremium || false,
          maxBookmarks: sessionUser.maxBookmarks || 100
        }
      };
      setUser(user);
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Oturum güncellenmesini bekle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Oturum başarıyla açıldıysa dashboard'a yönlendir
      if (signInResult?.ok) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut({ redirect: false });
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kayıt işlemi başarısız oldu');
      }

      // Kayıt başarılı olduktan sonra otomatik giriş yap
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profil güncellenemedi');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile }}>
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