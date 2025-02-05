'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import BookmarkList from '@/components/BookmarkList';
import SearchBar from '@/components/SearchBar';
import { Bookmark } from '@/types';
import { getBookmarks, saveBookmarks, toggleFavorite } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  text: string;
  userId: string;
  username: string;
  createdAt: string;
  bookmarkId: string;
}

interface UserFavorite {
  bookmarkId: string;
  userId: string;
  createdAt: string;
  bookmarkData: Bookmark;
}

export default function TagPage() {
  const { user } = useAuth();
  const params = useParams();
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) || '';
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [popularTags, setPopularTags] = useState<{name: string, count: number}[]>([]);
  const [userFavorites, setUserFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Kullanıcı favorilerini yükleme fonksiyonu
  const loadUserFavorites = useCallback(async () => {
    if (!user) {
      setUserFavorites([]);
      return;
    }

    const loadedBookmarks = await getBookmarks();
    let userFavs: UserFavorite[] = [];

    // Kullanıcının favorilerini yükle
    const storedFavorites = localStorage.getItem(`userFavorites_${user.id}`);
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        // Sadece var olan ve public bookmarkların favorilerini sakla
        userFavs = await Promise.all(parsedFavorites.map(async (fav: UserFavorite) => {
          const bookmark = (await loadedBookmarks).find(b => b.id === fav.bookmarkId);
          return bookmark && bookmark.isPublic ? fav : null;
        }));
        userFavs = userFavs.filter(Boolean);
      } catch (error) {
        console.error('Favori verisi parse edilemedi:', error);
      }
    }

    setUserFavorites(userFavs);
    
    // Eğer favori listesi değiştiyse localStorage'ı güncelle
    if (storedFavorites !== JSON.stringify(userFavs)) {
      localStorage.setItem(`userFavorites_${user.id}`, JSON.stringify(userFavs));
    }
  }, [user]);

  // Bookmarkları yükleme ve filtreleme
  const loadAndFilterBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Etiket sayfası yükleniyor:', params.name);
      
      // Etiketle ilgili bookmarkları getir
      const loadedBookmarks = await getBookmarks();
      
      // Favori sayılarını hesapla
      const favoriteCounts: Record<string, number> = {};
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('userFavorites_')) {
          try {
            const storedFavs = JSON.parse(localStorage.getItem(key) || '[]');
            // Sadece geçerli favorileri say
            storedFavs.forEach((fav: UserFavorite) => {
              const bookmark = loadedBookmarks.find(b => b.id === fav.bookmarkId);
              if (bookmark && bookmark.isPublic) {
                favoriteCounts[fav.bookmarkId] = (favoriteCounts[fav.bookmarkId] || 0) + 1;
              }
            });
          } catch (error) {
            console.error('Favori sayısı hesaplanırken hata:', error);
          }
        }
      });

      // Tüm etiketleri hesapla
      const tagCounts = loadedBookmarks.reduce((acc, bookmark) => {
        bookmark.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const sortedTags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setPopularTags(sortedTags);

      // Bookmarkları filtrele ve favori durumlarını işaretle
      const filteredAndMarkedBookmarks = loadedBookmarks
        .filter(bookmark => {
          // Eğer tag seçilmişse ve public ise göster
          if (name) {
            return bookmark.tags.includes(name) && bookmark.isPublic;
          }
          // Tag seçili değilse tüm public bookmarkları göster
          return bookmark.isPublic;
        })
        .map(bookmark => ({
          ...bookmark,
          isFavorite: user ? userFavorites.some(fav => fav.bookmarkId === bookmark.id) : false,
          favoriteCount: favoriteCounts[bookmark.id] || 0
        }));

      setBookmarks(filteredAndMarkedBookmarks);
      setLoading(false);
    } catch (error) {
      console.error('Etiket sayfası yüklenirken hata:', error);
      setError('Etiket sayfası yüklenirken bir hata oluştu');
      setLoading(false);
    }
  }, [name, user, userFavorites]);

  // localStorage değişikliklerini dinle
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `userFavorites_${user?.id}`) {
        loadUserFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, loadUserFavorites]);

  // İlk yükleme ve bağımlılıklar değiştiğinde
  useEffect(() => {
    loadUserFavorites();
  }, [user, loadUserFavorites]);

  useEffect(() => {
    loadAndFilterBookmarks();
  }, [loadAndFilterBookmarks]);

  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  const handleRemove = async (id: string) => {
    const allBookmarks = await getBookmarks();
    const updatedBookmarks = allBookmarks.filter(b => b.id !== id);
    await saveBookmarks(updatedBookmarks);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    
    // Eğer silinen bookmark favorilerdeyse, favorilerden de kaldır
    if (userFavorites.some(fav => fav.bookmarkId === id)) {
      const newFavorites = userFavorites.filter(fav => fav.bookmarkId !== id);
      setUserFavorites(newFavorites);
      localStorage.setItem(`userFavorites_${user?.id}`, JSON.stringify(newFavorites));
    }
  };

  const handleToggleFavorite = async (bookmarkId: string) => {
    if (!user) return;

    try {
      const result = await toggleFavorite(bookmarkId);
      
      // Bookmark state'ini güncelle
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === bookmarkId
          ? {
              ...bookmark,
              isFavorite: result.action === 'added',
              favoriteCount: result.action === 'added'
                ? (bookmark.favoriteCount || 0) + 1
                : Math.max(0, (bookmark.favoriteCount || 0) - 1)
            }
          : bookmark
      ));

      // Favorileri güncelle
      if (result.action === 'added') {
        setUserFavorites(prev => [...prev, {
          bookmarkId,
          userId: user.id,
          createdAt: new Date().toISOString()
        }]);
      } else {
        setUserFavorites(prev => prev.filter(fav => fav.bookmarkId !== bookmarkId));
      }

      toast.success(result.action === 'added' ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
      toast.error('Favori işlemi gerçekleştirilemedi');
    }
  };

  const handleAddComment = async (bookmarkId: string, commentText: string) => {
    if (!user) return;

    const allBookmarks = await getBookmarks();
    const targetBookmark = allBookmarks.find(b => b.id === bookmarkId);
    
    if (!targetBookmark) return;

    const newComment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: commentText,
      createdAt: new Date().toISOString(),
      bookmarkId
    };

    // Bookmark'ı güncelle
    const updatedBookmarks = allBookmarks.map(b =>
      b.id === bookmarkId
        ? {
            ...b,
            comments: [...(b.comments || []), newComment]
          }
        : b
    );

    try {
      await saveBookmarks(updatedBookmarks);
      
      // UI'ı güncelle
      setBookmarks(prev => prev.map(b =>
        b.id === bookmarkId
          ? {
              ...b,
              comments: [...(b.comments || []), newComment]
            }
          : b
      ));
    } catch (error) {
      console.error('Yorum eklenirken hata oluştu:', error);
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.title.toLowerCase().includes(searchTerm) ||
    bookmark.description?.toLowerCase().includes(searchTerm) ||
    bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-6">
              {name ? `Bookmarks Tagged with "${decodeURIComponent(name)}"` : 'All Tags'}
            </h1>
            <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p>{error}</p>
            ) : (
              <BookmarkList 
                bookmarks={filteredBookmarks}
                onRemove={handleRemove}
                onToggleFavorite={handleToggleFavorite}
                onAddComment={handleAddComment}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Popular Tags
            </h2>
            <div className="space-y-2">
              {popularTags.map(tag => (
                <div key={tag.name} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="flex items-center hover:text-blue-600 text-gray-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {tag.name}
                  </Link>
                  <span className="text-gray-500">{tag.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}