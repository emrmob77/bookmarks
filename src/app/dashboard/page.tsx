'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BookmarkForm from '@/components/BookmarkForm';
import SearchBar from '@/components/SearchBar';
import { Bookmark, NewBookmark } from '@/types';
import { getBookmarks, saveBookmarks } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkList from '@/components/BookmarkList';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();

  useEffect(() => {
    const loadedBookmarks = getBookmarks();
    setBookmarks(loadedBookmarks);
  }, []);

  const handleAddBookmark = (bookmark: NewBookmark) => {
    if (!user) return;

    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isOwner: true,
      isFavorite: false,
      isPinned: false,
      username: user.username,
      comments: [],
      favoriteCount: 0
    };
    const updatedBookmarks = [newBookmark, ...bookmarks];
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  const handleUpdateBookmark = (updatedBookmark: Bookmark) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === updatedBookmark.id ? { ...updatedBookmark, comments: bookmark.comments || [] } : bookmark
    );
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
    setEditingBookmark(undefined);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleRemoveBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  const handleToggleFavorite = (bookmarkId: string) => {
    if (!user) return;
    
    // Tüm bookmarkları al
    const allBookmarks = getBookmarks();
    const targetBookmark = allBookmarks.find(b => b.id === bookmarkId);
    
    if (!targetBookmark) return;

    // Kullanıcının favorilerini al
    const userFavoritesKey = `userFavorites_${user.id}`;
    let userFavorites = [];
    try {
      userFavorites = JSON.parse(localStorage.getItem(userFavoritesKey) || '[]');
    } catch (error) {
      console.error('Favori verisi parse edilemedi:', error);
    }

    const isFavorited = userFavorites.some((fav: any) => fav.bookmarkId === bookmarkId);
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = userFavorites.filter((fav: any) => fav.bookmarkId !== bookmarkId);
    } else {
      const newFavorite = {
        bookmarkId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        bookmarkData: targetBookmark
      };
      newFavorites = [...userFavorites, newFavorite];
    }

    // Local storage'ı güncelle
    localStorage.setItem(userFavoritesKey, JSON.stringify(newFavorites));

    // Tüm kullanıcıların favorilerini topla
    const allFavorites: any[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('userFavorites_')) {
        try {
          const storedFavs = JSON.parse(localStorage.getItem(key) || '[]');
          allFavorites.push(...storedFavs);
        } catch (error) {
          console.error('Favori verisi parse edilemedi:', error);
        }
      }
    });

    // Toplam favori sayısını hesapla
    const totalFavoriteCount = allFavorites.filter(fav => fav.bookmarkId === bookmarkId).length;

    // Bookmark'ları güncelle
    const updatedBookmarks = allBookmarks.map(bookmark =>
      bookmark.id === bookmarkId
        ? { 
            ...bookmark, 
            isFavorite: !isFavorited,
            favoriteCount: totalFavoriteCount
          }
        : bookmark
    );

    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  const handleTogglePinned = (bookmarkId: string) => {
    if (!user) return;
    
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId && bookmark.username === user.username
        ? { 
            ...bookmark, 
            isPinned: !bookmark.isPinned
          }
        : bookmark
    );
    setBookmarks(updatedBookmarks);
    saveBookmarks(updatedBookmarks);
  };

  const handleAddComment = (bookmarkId: string, commentText: string) => {
    if (!user) return;

    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId
        ? {
            ...bookmark,
            comments: [
              ...(bookmark.comments || []),
              {
                id: Date.now().toString(),
                text: commentText,
                username: user.username,
                createdAt: new Date().toISOString()
              }
            ]
          }
        : bookmark
    );
    const typedBookmarks: Bookmark[] = updatedBookmarks.map(bookmark => ({
      ...bookmark,
      comments: bookmark.comments?.map(comment => ({
        ...comment,
        bookmarkId: bookmark.id,
        userId: user?.id || ''
      })) || []
    }));
    setBookmarks(typedBookmarks);
    saveBookmarks(typedBookmarks);
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!user) return false;

    switch (activeTab) {
      case 'bookmarks':
        return matchesSearch && bookmark.username === user.username;
      case 'favorites':
        return matchesSearch && bookmark.isFavorite && bookmark.username === user.username;
      case 'comments':
        return matchesSearch && bookmark.comments?.some(comment => comment.username === user.username);
      default:
        return false;
    }
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const trendingBookmarks = [...bookmarks]
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
    .slice(0, 5);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));
  const popularTags = allTags.map(tag => ({
    name: tag,
    count: bookmarks.filter(b => b.tags.includes(tag)).length
  })).sort((a, b) => b.count - a.count);

  return (
    <Layout hideHeader>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Add/Edit Bookmark Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
              </h2>
              <BookmarkForm
                onAdd={handleAddBookmark}
                editingBookmark={editingBookmark}
                onUpdate={(bookmark: Bookmark) => {
                  const updatedBookmark = {
                    ...bookmark,
                    isOwner: false,
                    isFavorite: false, 
                    isPinned: false,
                    comments: []
                  };
                  handleUpdateBookmark(updatedBookmark);
                }}
                onCancel={() => setEditingBookmark(undefined)}
              />
            </div>
          </div>

          {/* Middle Column - Bookmarks List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
            </div>

            <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'bookmarks'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  My Bookmarks
                </div>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'favorites'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  My Favorites
                </div>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'comments'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  My Comments
                </div>
              </button>
            </div>

            {/* Bookmarks List */}
            <div className="space-y-4">
              {filteredBookmarks.length > 0 ? (
                <BookmarkList
                  bookmarks={filteredBookmarks}
                  onRemove={handleRemoveBookmark}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePinned={handleTogglePinned}
                  onEdit={setEditingBookmark}
                  onAddComment={handleAddComment}
                />
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900">
                    No bookmarks found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'bookmarks' && "You haven't added any bookmarks yet."}
                    {activeTab === 'favorites' && "You haven't favorited any bookmarks yet."}
                    {activeTab === 'comments' && "You haven't commented on any bookmarks yet."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Popular Tags */}
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
    </Layout>
  );
} 