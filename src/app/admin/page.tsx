'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUsers, saveUsers, getBookmarks } from '@/lib/storage';

interface UserSettings {
  maxBookmarks: number;
  isApproved: boolean;
  isPremium: boolean;
  premiumUntil?: string;
  role: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  settings: UserSettings;
  createdAt: string;
  bookmarkCount: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.role === 'admin') {
      router.push('/');
      return;
    }

    loadUsers();
  }, [user, router]);

  const loadUsers = () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = getUsers();
      const bookmarks = getBookmarks();
      
      // Kullanıcı ayarlarını kontrol et ve varsayılan değerleri ekle
      const updatedUsers = allUsers.map((u: any) => {
        // Kullanıcının yer imi sayısını hesapla
        const userBookmarkCount = bookmarks.filter((b: any) => b.username === u.username).length;
        
        return {
          ...u,
          bookmarkCount: userBookmarkCount,
          settings: {
            maxBookmarks: u.settings?.maxBookmarks || 10,
            isApproved: u.settings?.isApproved ?? false,
            isPremium: u.settings?.isPremium ?? false,
            premiumUntil: u.settings?.premiumUntil || null,
            role: u.settings?.role || 'user'
          }
        };
      });

      setUsers(updatedUsers);
      saveUsers(updatedUsers); // Güncellenmiş kullanıcıları kaydet
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApproval = (userId: string) => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            settings: {
              ...u.settings,
              isApproved: !u.settings.isApproved
            }
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      setMessage('Kullanıcı durumu güncellendi');
    } catch (error) {
      setError('Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleTogglePremium = (userId: string) => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            settings: {
              ...u.settings,
              isPremium: !u.settings.isPremium,
              premiumUntil: !u.settings.isPremium 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 gün
                : undefined,
              maxBookmarks: !u.settings.isPremium ? 100 : 10 // Premium kullanıcılar için 100, normal kullanıcılar için 10
            }
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      setMessage('Premium durum güncellendi');
    } catch (error) {
      setError('Premium durum güncellenirken hata oluştu');
    }
  };

  const handleUpdateMaxBookmarks = (userId: string, value: number) => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            settings: {
              ...u.settings,
              maxBookmarks: value
            }
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      setMessage('Maksimum yer imi sayısı güncellendi');
    } catch (error) {
      setError('Maksimum yer imi sayısı güncellenirken hata oluştu');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/seo-settings"
            className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">SEO Ayarları</h2>
                <p className="mt-1 text-sm text-gray-500">robots.txt ve sitemap yönetimi</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Kullanıcı Yönetimi</h2>
          <p className="mt-1 text-sm text-gray-500">Kullanıcı durumlarını ve limitlerini yönetin</p>
        </div>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yer İmleri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Yer İmi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleApproval(user.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.settings.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.settings.isApproved ? 'Onaylı' : 'Onaysız'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePremium(user.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.settings.isPremium
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.settings.isPremium ? 'Premium' : 'Ücretsiz'}
                      </button>
                      {user.settings.premiumUntil && (
                        <div className="text-xs text-gray-500 mt-1">
                          Bitiş: {new Date(user.settings.premiumUntil).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{user.bookmarkCount}</span>
                        <span className="text-sm text-gray-500 ml-1">/ {user.settings.maxBookmarks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            user.bookmarkCount >= user.settings.maxBookmarks 
                              ? 'bg-red-500' 
                              : user.bookmarkCount >= user.settings.maxBookmarks * 0.8 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((user.bookmarkCount / user.settings.maxBookmarks) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={user.settings.maxBookmarks}
                        onChange={(e) => handleUpdateMaxBookmarks(user.id, parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border rounded-md"
                        min="1"
                        max="1000"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/users/${user.username}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Profili Görüntüle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 