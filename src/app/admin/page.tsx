'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface UserSettings {
  maxBookmarks: number;
  isApproved: boolean;
  isPremium: boolean;
  premiumUntil?: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  bookmarkCount: number;
  isApproved: boolean;
  isPremium: boolean;
  premiumUntil: string | null;
  maxBookmarks: number;
}

export default function AdminPanel() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadUsers();
  }, [session, router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kullanıcılar yüklenemedi');
      }
      const data = await response.json();
      console.log('Loaded users:', data);
      
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('Invalid users data:', data);
        throw new Error('Geçersiz kullanıcı verisi');
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      setError(error instanceof Error ? error.message : 'Kullanıcılar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApproval = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: !user.isApproved
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kullanıcı güncellenemedi');
      }

      await loadUsers();
      setMessage('Kullanıcı durumu güncellendi');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleTogglePremium = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        console.error('User not found:', userId);
        setError('Kullanıcı bulunamadı');
        return;
      }

      const newIsPremium = !user.isPremium;
      
      // MySQL datetime formatına uygun tarih oluştur (YYYY-MM-DD HH:mm:ss)
      const premiumUntil = newIsPremium 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ')
        : null;
      
      console.log('Updating premium status:', {
        userId,
        newIsPremium,
        premiumUntil
      });

      setError(null);
      setMessage(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPremium: newIsPremium,
          premiumUntil: premiumUntil
        }),
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Premium durum güncellenemedi');
      }

      await loadUsers();
      setMessage(responseData.message || 'Premium durum güncellendi');
    } catch (error) {
      console.error('Premium update error:', error);
      setError(error instanceof Error ? error.message : 'Premium durum güncellenirken hata oluştu');
      
      // Hata durumunda mevcut kullanıcı listesini yeniden yükle
      await loadUsers();
    }
  };

  const handleUpdateMaxBookmarks = async (userId: string, value: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxBookmarks: value
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Maksimum yer imi sayısı güncellenemedi');
      }

      await loadUsers();
      setMessage('Maksimum yer imi sayısı güncellendi');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Maksimum yer imi sayısı güncellenirken hata oluştu');
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
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleApproval(user.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isApproved ? 'Onaylı' : 'Onaysız'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePremium(user.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.isPremium
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.isPremium ? 'Premium' : 'Ücretsiz'}
                      </button>
                      {user.premiumUntil && (
                        <div className="text-xs text-gray-500 mt-1">
                          Bitiş: {new Date(user.premiumUntil).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{user.bookmarkCount}</span>
                        <span className="text-sm text-gray-500 ml-1">/ {user.maxBookmarks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            user.bookmarkCount >= user.maxBookmarks 
                              ? 'bg-red-500' 
                              : user.bookmarkCount >= user.maxBookmarks * 0.8 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((user.bookmarkCount / user.maxBookmarks) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={user.maxBookmarks}
                        onChange={(e) => handleUpdateMaxBookmarks(user.id, parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border rounded-md"
                        min="1"
                        max="1000"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/users/${user.name}`}
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