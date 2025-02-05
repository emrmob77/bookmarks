'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BookmarkList from '@/components/BookmarkList';
import SearchBar from '@/components/SearchBar';
import { Bookmark, Comment, FavoriteResponse } from '@/types';
import { getBookmarks, updateBookmark, toggleFavorite } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const loadedBookmarks = await getBookmarks();
        setBookmarks(loadedBookmarks);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        setBookmarks([]);
      }
    };
    
    loadBookmarks();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      const updatedBookmarks = bookmarks.filter(b => b.id !== id);
      setBookmarks(updatedBookmarks);
      
      // Bookmark'ı bul ve güncelle
      const bookmarkToUpdate = bookmarks.find(b => b.id === id);
      if (bookmarkToUpdate) {
        await updateBookmark({
          ...bookmarkToUpdate,
          isPublic: false // Silmek yerine gizli yapıyoruz
        });
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/bookmarks/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId: id }),
      });

      const result: FavoriteResponse = await response.json();
      
      // Bookmark state'ini güncelle
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === id
          ? {
              ...bookmark,
              isFavorite: result.action === 'added',
              favoriteCount: result.favoriteCount || bookmark.favoriteCount || 0
            }
          : bookmark
      ));

      toast.success(result.action === 'added' ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
      toast.error('Favori işlemi gerçekleştirilemedi');
    }
  };

  const handleAddComment = async (bookmarkId: string, commentData: any) => {
    if (!user) return;

    try {
      // Bookmark'ları yeniden yükle
      const loadedBookmarks = await getBookmarks();
      setBookmarks(loadedBookmarks);
    } catch (error: any) {
      console.error('Error updating bookmarks:', error);
      toast.error('Yorumlar güncellenirken bir hata oluştu');
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && bookmark.isPublic;
  });

  const trendingBookmarks = [...bookmarks]
    .filter(b => b.isPublic)
    .sort((a, b) => {
      const bFavorites = b.favoriteCount || 0;
      const aFavorites = a.favoriteCount || 0;
      if (bFavorites !== aFavorites) return bFavorites - aFavorites;
      
      const bComments = (b.comments || []).length;
      const aComments = (a.comments || []).length;
      if (bComments !== aComments) return bComments - aComments;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter(bookmark => {
      if (searchTerm === '') return true;
      return bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
             bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .slice(0, 10);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));
  const popularTags = allTags.map(tag => ({
    name: tag,
    count: bookmarks.filter(b => b.tags.includes(tag)).length
  })).sort((a, b) => b.count - a.count);

  const recentComments = bookmarks
    .filter(b => b.isPublic && b.comments && b.comments.length > 0)
    .flatMap(bookmark => 
      (bookmark.comments || []).map(comment => ({
        ...comment,
        bookmarkTitle: bookmark.title,
        bookmarkId: bookmark.id
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
            </div>

            <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'trending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 4h-8m0 4h8m-8-8a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Trending
                </div>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  All Bookmarks
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
                  Comments
                </div>
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'comments' ? (
              <div className="space-y-4">
                {recentComments.length > 0 ? (
                  recentComments.map(comment => (
                    <div key={comment.id} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {comment.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/users/${encodeURIComponent(comment.username)}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {comment.username}
                              </Link>
                              <span className="text-sm text-gray-500">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <Link
                              href={`/bookmark/${comment.bookmarkId}`}
                              className="mt-1 text-blue-600 hover:text-blue-800 block"
                            >
                              {comment.bookmarkTitle}
                            </Link>
                            <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-base font-medium text-gray-900">No comments yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Be the first to comment on a bookmark!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'trending' ? trendingBookmarks : filteredBookmarks).length > 0 ? (
                  <BookmarkList
                    bookmarks={activeTab === 'trending' ? trendingBookmarks : filteredBookmarks}
                    onRemove={handleRemoveBookmark}
                    onToggleFavorite={handleToggleFavorite}
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
                    <h3 className="mt-2 text-base font-medium text-gray-900">No bookmarks found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter to find what you're looking for.
                    </p>
                  </div>
                )}
              </div>
            )}
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
