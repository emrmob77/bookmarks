'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BookmarkForm from '@/components/BookmarkForm';
import SearchBar from '@/components/SearchBar';
import { Bookmark, NewBookmark, Comment } from '@/types';
import { getBookmarks, updateBookmark, addBookmark, deleteBookmark, toggleFavorite } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkList from '@/components/BookmarkList';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const data = await getBookmarks();
        setBookmarks(data);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, []);

  const handleAddBookmark = async (bookmark: NewBookmark) => {
    if (!user) return;

    try {
      const newBookmark: Bookmark = {
        ...bookmark,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        favoriteCount: 0,
        isFavorite: false,
        isPinned: false,
        comments: [],
        tags: bookmark.tags || [],
        isPublic: bookmark.isPublic ?? true,
        userId: user.id,
        username: user.username
      };

      console.log('Gönderilen yer imi verisi:', {
        url: newBookmark.url,
        title: newBookmark.title,
        description: newBookmark.description,
        isPublic: newBookmark.isPublic,
        tags: newBookmark.tags,
        userId: newBookmark.userId,
        username: newBookmark.username
      });

      const savedBookmark = await addBookmark(newBookmark);
      console.log('Kaydedilen yer imi:', savedBookmark);
      
      // Tüm yer imlerini tekrar yükle
      const loadedBookmarks = await getBookmarks({
        userId: user.id,
        page: 1,
        limit: 10
      });
      setBookmarks(loadedBookmarks);
    } catch (error: any) {
      console.error('Bookmark eklenirken hata oluştu:', error);
      console.error('Hata detayları:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      // Kullanıcıya hata mesajını göster
      alert(`Yer imi eklenirken bir hata oluştu: ${error.message}`);
    }
  };

  const handleUpdateBookmark = async (updatedBookmark: Bookmark) => {
    if (!user) return;

    try {
      await updateBookmark(updatedBookmark);
      
      // Tüm yer imlerini tekrar yükle
      const loadedBookmarks = await getBookmarks({
        userId: user.id,
        page: 1,
        limit: 10
      });
      setBookmarks(loadedBookmarks);
    } catch (error) {
      console.error('Bookmark güncellenirken hata oluştu:', error);
      toast.error('Yer imi güncellenirken bir hata oluştu');
    }
    setEditingBookmark(undefined);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      await deleteBookmark(id);
      // Local state'i güncelle
      setBookmarks(prevBookmarks => prevBookmarks.filter(b => b.id !== id));
    } catch (error) {
      console.error('Bookmark silinirken hata oluştu:', error);
      alert('Yer imi silinirken bir hata oluştu');
    }
  };

  const handleTogglePinned = async (bookmarkId: string) => {
    if (!user) return;
    
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    try {
      const updatedBookmark: Bookmark = {
        ...bookmark,
        isPinned: !bookmark.isPinned
      };

      await updateBookmark(updatedBookmark);
      
      // Tüm yer imlerini tekrar yükle
      const loadedBookmarks = await getBookmarks({
        userId: user.id,
        page: 1,
        limit: 10
      });
      setBookmarks(loadedBookmarks);
    } catch (error) {
      console.error('Pinleme işlemi sırasında hata:', error);
      toast.error('Pinleme işlemi başarısız oldu');
    }
  };

  const handleToggleFavorite = async (bookmarkId: string) => {
    if (!user) return;
    
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    try {
      const result = await toggleFavorite(bookmarkId);
      
      const updatedBookmark: Bookmark = {
        ...bookmark,
        isFavorite: result.action === 'added',
        favoriteCount: result.action === 'added'
          ? (bookmark.favoriteCount || 0) + 1
          : Math.max(0, (bookmark.favoriteCount || 0) - 1)
      };

      const updatedBookmarks = bookmarks.map(b =>
        b.id === bookmarkId ? updatedBookmark : b
      );
      setBookmarks(updatedBookmarks);
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
      toast.error('Favori işlemi gerçekleştirilemedi');
    }
  };

  const handleAddComment = async (bookmarkId: string, commentText: string) => {
    if (!user) return;

    try {
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (!bookmark) return;

      const newComment: Comment = {
        id: Date.now().toString(),
        text: commentText,
        userId: user.id,
        username: user.username,
        bookmarkId,
        createdAt: new Date().toISOString()
      };

      const updatedBookmark = {
        ...bookmark,
        comments: [...(bookmark.comments || []), newComment]
      };

      const savedBookmark = await updateBookmark(updatedBookmark);
      const updatedBookmarks = bookmarks.map(b =>
        b.id === bookmarkId ? savedBookmark : b
      );
      
      setBookmarks(updatedBookmarks);
    } catch (error) {
      console.error('Yorum eklenirken hata oluştu:', error);
    }
  };

  const filteredBookmarks = (bookmarks || []).filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!user) return false;

    switch (activeTab) {
      case 'bookmarks':
        return matchesSearch && bookmark.username === user.username;
      case 'favorites':
        return matchesSearch;
      case 'comments':
        return matchesSearch && bookmark.comments?.some(comment => comment.userId === user.id) || false;
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