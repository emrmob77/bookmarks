import { Bookmark, NewBookmark, User } from '@/types';

// Senkronizasyon fonksiyonu
async function syncToServer(endpoint: string, data: any) {
  try {
    const response = await fetch(`/api/sync/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Sync error: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`${endpoint} sync error:`, error);
  }
}

export async function getBookmarks(options: { userId?: string; tag?: string; search?: string; page?: number; limit?: number; favorites?: boolean } = {}): Promise<Bookmark[]> {
  try {
    const { userId, tag, search, page = 1, limit = 10, favorites } = options;
    let url = '/api/bookmarks?';

    if (userId) url += `userId=${encodeURIComponent(userId)}&`;
    if (tag) url += `tag=${encodeURIComponent(tag)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (favorites) url += `favorites=true&`;
    url += `page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (response.status === 401) {
      console.error('Oturum açılmamış veya süresi dolmuş');
      throw new Error('Lütfen tekrar giriş yapın');
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Yer imleri yüklenirken hata oluştu');
    }

    const data = await response.json();
    return data.bookmarks || [];
  } catch (error: any) {
    console.error('Yer imleri yüklenirken hata:', error);
    throw error;
  }
}

export async function addBookmark(bookmark: NewBookmark): Promise<Bookmark> {
  try {
    console.log('API isteği gönderiliyor:', {
      url: '/api/bookmarks',
      method: 'POST',
      body: {
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        isPublic: bookmark.isPublic,
        tags: bookmark.tags,
        userId: bookmark.userId,
        username: bookmark.username
      }
    });

    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(bookmark),
    });

    console.log('API yanıtı:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('API hata yanıtı:', data);
      throw new Error(data.error || data.message || 'Yer imi eklenirken hata oluştu');
    }

    const result = await response.json();
    console.log('API başarılı yanıt:', result);
    return result;
  } catch (error: any) {
    console.error('addBookmark fonksiyonunda hata:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error;
  }
}

export async function updateBookmark(bookmark: Bookmark): Promise<Bookmark> {
  try {
    console.log('Güncellenecek bookmark:', bookmark);
    
    const response = await fetch(`/api/bookmarks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...bookmark,
        is_pinned: bookmark.isPinned
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Güncelleme hatası:', data);
      throw new Error(data.message || 'Yer imi güncellenirken hata oluştu');
    }

    const result = await response.json();
    console.log('Güncellenmiş bookmark:', result);
    return result;
  } catch (error: any) {
    console.error('updateBookmark fonksiyonunda hata:', error);
    throw error;
  }
}

export async function deleteBookmark(id: string): Promise<void> {
  const response = await fetch(`/api/bookmarks?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Yer imi silinirken hata oluştu');
  }
}

export async function getBookmarksByUser(userId: string): Promise<Bookmark[]> {
  const response = await fetch(`/api/bookmarks?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bookmarks by user');
  }

  const data = await response.json();
  return data.bookmarks;
}

export async function getBookmarksByTag(tag: string): Promise<Bookmark[]> {
  const response = await fetch(`/api/bookmarks?tag=${tag}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bookmarks by tag');
  }

  const data = await response.json();
  return data.bookmarks;
}

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const response = await fetch(`/api/bookmarks?search=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search bookmarks');
  }

  const data = await response.json();
  return data.bookmarks;
}

export async function getUserFavorites(userId: string): Promise<any[]> {
  const response = await fetch(`/api/userFavorites?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user favorites');
  }

  const data = await response.json();
  return data.userFavorites;
}

export async function saveUserFavorites(userId: string, favorites: any[]): Promise<void> {
  const response = await fetch(`/api/userFavorites/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(favorites),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save user favorites');
  }
}

export async function getSeoSettings(): Promise<{ robotsTxt: string; sitemapUrl: string }> {
  const response = await fetch('/api/seoSettings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch SEO settings');
  }

  const data = await response.json();
  return data.seoSettings;
}

export async function saveSeoSettings(settings: { robotsTxt: string; sitemapUrl: string }): Promise<void> {
  const response = await fetch('/api/seoSettings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save SEO settings');
  }
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Kullanıcılar yüklenirken hata oluştu');
  }

  const data = await response.json();
  return data.users;
}

export async function saveUsers(users: User[]): Promise<void> {
  const response = await fetch('/api/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(users),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Kullanıcılar kaydedilirken hata oluştu');
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Kullanıcı doğrulama hatası');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Kullanıcı doğrulama hatası:', error);
    return null;
  }
}

export async function getAllTags(): Promise<string[]> {
  const bookmarks = await getBookmarks();
  const tagSet = new Set<string>();
  
  bookmarks.forEach((bookmark: Bookmark) => {
    bookmark.tags.forEach((tag: string) => tagSet.add(tag));
  });
  
  return Array.from(tagSet);
}

// Ayarları getir
export async function getSettings() {
  try {
    const response = await fetch('/api/settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ayarlar getirilirken hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Ayarlar getirilirken hata:', error);
    throw error;
  }
}

// Ayarları güncelle
export async function updateSettings(settings: {
  theme: string;
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
}) {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ayarlar güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Ayarlar güncellenirken hata:', error);
    throw error;
  }
}

interface ProfileData {
  username: string;
  email: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

// Profil bilgilerini getir
export async function getProfile() {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Profil bilgileri getirilirken hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Profil bilgileri getirilirken hata:', error);
    throw error;
  }
}

// Profil bilgilerini güncelle
export async function updateProfile(profile: ProfileData) {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: profile.username,
        email: profile.email,
        bio: profile.bio,
        website: profile.website,
        twitter: profile.twitter?.replace('@', ''),
        github: profile.github
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Profil güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Profil güncellenirken hata:', error);
    throw error;
  }
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    await syncToServer('bookmarks', bookmarks);
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
}

// Kullanıcı profilini getir
export async function getUserProfile(username: string) {
  try {
    const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Kullanıcı profili getirilirken hata oluştu');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Kullanıcı profili getirilirken hata:', error);
    throw error;
  }
}

export async function toggleFavorite(bookmarkId: string): Promise<{ success: boolean; action: 'added' | 'removed' }> {
  const response = await fetch('/api/bookmarks/favorite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ bookmarkId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle favorite');
  }

  return response.json();
}