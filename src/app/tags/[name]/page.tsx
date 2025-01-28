'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import BookmarkList from '@/components/BookmarkList';
import SearchBar from '@/components/SearchBar';
import { Bookmark } from '@/types';
import { getBookmarks, saveBookmarks } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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

  // Kullanıcı favorilerini yükleme fonksiyonu
  const loadUserFavorites = useCallback(() => {
    if (!user) {
      setUserFavorites([]);
      return;
    }

    const loadedBookmarks = getBookmarks();
    let userFavs: UserFavorite[] = [];

    // Kullanıcının favorilerini yükle
    const storedFavorites = localStorage.getItem(`userFavorites_${user.id}`);
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        // Sadece var olan ve public bookmarkların favorilerini sakla
        userFavs = parsedFavorites.filter((fav: UserFavorite) => {
          const bookmark = loadedBookmarks.find(b => b.id === fav.bookmarkId);
          return bookmark && bookmark.isPublic;
        });
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
  const loadAndFilterBookmarks = useCallback(() => {
    const loadedBookmarks = getBookmarks();
    
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

  const handleRemove = (id: string) => {
    const allBookmarks = getBookmarks();
    const updatedBookmarks = allBookmarks.filter(b => b.id !== id);
    saveBookmarks(updatedBookmarks);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    
    // Eğer silinen bookmark favorilerdeyse, favorilerden de kaldır
    if (userFavorites.some(fav => fav.bookmarkId === id)) {
      const newFavorites = userFavorites.filter(fav => fav.bookmarkId !== id);
      setUserFavorites(newFavorites);
      localStorage.setItem(`userFavorites_${user?.id}`, JSON.stringify(newFavorites));
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;

    const allBookmarks = getBookmarks();
    const targetBookmark = allBookmarks.find(b => b.id === id);
    
    if (!targetBookmark) return;

    // Sadece public yer imlerini favoriye ekleyebilir
    if (!targetBookmark.isPublic) {
      console.error('Bu yer imini favoriye ekleyemezsiniz.');
      return;
    }

    const isFavorited = userFavorites.some(fav => fav.bookmarkId === id);
    let newFavorites: UserFavorite[];
    
    if (isFavorited) {
      newFavorites = userFavorites.filter(fav => fav.bookmarkId !== id);
    } else {
      const newFavorite: UserFavorite = {
        bookmarkId: id,
        userId: user.id,
        createdAt: new Date().toISOString(),
        bookmarkData: targetBookmark
      };
      newFavorites = [...userFavorites, newFavorite];
    }

    // Local storage'ı güncelle
    localStorage.setItem(`userFavorites_${user.id}`, JSON.stringify(newFavorites));
    setUserFavorites(newFavorites);

    // Tüm kullanıcıların favorilerini topla ve sayıyı güncelle
    const allFavorites: UserFavorite[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('userFavorites_')) {
        try {
          const storedFavs = JSON.parse(localStorage.getItem(key) || '[]');
          // Sadece geçerli favorileri ekle
          const validFavs = storedFavs.filter((fav: UserFavorite) => {
            const bookmark = allBookmarks.find(b => b.id === fav.bookmarkId);
            return bookmark && bookmark.isPublic;
          });
          allFavorites.push(...validFavs);
        } catch (error) {
          console.error('Favori verisi parse edilemedi:', error);
        }
      }
    });

    // Toplam favori sayısını hesapla
    const totalFavoriteCount = allFavorites.filter(fav => fav.bookmarkId === id).length;

    // Bookmark'ları güncelle
    const updatedBookmarks = allBookmarks.map(b => ({
      ...b,
      isFavorite: b.id === id ? !isFavorited : b.isFavorite,
      favoriteCount: b.id === id ? totalFavoriteCount : b.favoriteCount
    }));

    setBookmarks(prev => prev.map(b => ({
      ...b,
      isFavorite: b.id === id ? !isFavorited : b.isFavorite,
      favoriteCount: b.id === id ? totalFavoriteCount : b.favoriteCount
    })));

    saveBookmarks(updatedBookmarks);
  };

  const handleAddComment = (bookmarkId: string, commentText: string) => {
    if (!user) return;

    const allBookmarks = getBookmarks();
    const updatedBookmarks = allBookmarks.map(b => 
      b.id === bookmarkId 
        ? { 
            ...b, 
            comments: [...(b.comments || []), { 
              id: Date.now().toString(),
              text: commentText,
              createdAt: new Date().toISOString(),
              userId: user.id,
              username: user.username,
              bookmarkId
            }]
          } 
        : b
    );
    saveBookmarks(updatedBookmarks);
    setBookmarks(prev => prev.map(b => 
      b.id === bookmarkId 
        ? { 
            ...b, 
            comments: [...(b.comments || []), { 
              id: Date.now().toString(),
              text: commentText,
              createdAt: new Date().toISOString(),
              userId: user.id,
              username: user.username,
              bookmarkId
            }]
          } 
        : b
    ));
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
            <BookmarkList 
              bookmarks={filteredBookmarks}
              onRemove={handleRemove}
              onToggleFavorite={handleToggleFavorite}
              onAddComment={handleAddComment}
            />
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