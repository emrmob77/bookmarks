'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Bookmark, Comment } from '@/types';
import { getBookmarks, deleteBookmark } from '@/lib/storage';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export default function BookmarkDetail() {
  const params = useParams();
  const { user } = useAuth();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    const loadBookmark = async () => {
      try {
        const allBookmarks = await getBookmarks();
        const foundBookmark = allBookmarks.find(b => b.id === params.id);
        if (foundBookmark) {
          // Kullanıcının favorilerini kontrol et
          if (user) {
            const userFavoritesKey = `userFavorites_${user.id}`;
            try {
              const userFavorites = JSON.parse(localStorage.getItem(userFavoritesKey) || '[]');
              foundBookmark.isFavorite = userFavorites.some((fav: any) => fav.bookmarkId === foundBookmark.id);
            } catch (error) {
              console.error('Favori verisi yüklenirken hata:', error);
            }
          }

          // Toplam favori sayısını hesapla
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
          foundBookmark.favoriteCount = allFavorites.filter(fav => fav.bookmarkId === foundBookmark.id).length;
        }
        setBookmark(foundBookmark || null);
      } catch (error) {
        console.error('Bookmark yüklenirken hata oluştu:', error);
      }
    };

    loadBookmark();
  }, [params.id, user]);

  const handleToggleFavorite = async () => {
    if (!user || !bookmark) return;

    const userFavoritesKey = `userFavorites_${user.id}`;
    let userFavorites = [];
    try {
      userFavorites = JSON.parse(localStorage.getItem(userFavoritesKey) || '[]');
    } catch (error) {
      console.error('Favori verisi parse edilemedi:', error);
    }

    const isFavorited = userFavorites.some((fav: any) => fav.bookmarkId === bookmark.id);
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = userFavorites.filter((fav: any) => fav.bookmarkId !== bookmark.id);
    } else {
      const newFavorite = {
        bookmarkId: bookmark.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      newFavorites = [...userFavorites, newFavorite];
    }

    localStorage.setItem(userFavoritesKey, JSON.stringify(newFavorites));

    // Bookmark'ı güncelle
    const allBookmarks = await getBookmarks();
    const updatedBookmarks = allBookmarks.map((b: Bookmark) =>
      b.id === bookmark.id
        ? { ...b, isFavorite: !isFavorited }
        : b
    );
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    setBookmark(prev => prev ? { ...prev, isFavorite: !isFavorited } : null);
  };

  const handleAddComment = async () => {
    if (!user || !bookmark || !commentText.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookmarkId: bookmark.id,
          content: commentText.trim(),
          clientCommentId: uuidv4()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yorum eklenirken bir hata oluştu');
      }

      console.log('Sunucudan gelen yorum verisi:', data);

      // Bookmark'ı güncelle
      setBookmark(prev => {
        if (!prev) return null;
        
        const updatedComments = [...(prev.comments || [])];
        const existingCommentIndex = updatedComments.findIndex(c => c.id === data.id);
        
        if (existingCommentIndex >= 0) {
          // Varolan yorumu güncelle
          updatedComments[existingCommentIndex] = {
            id: data.id,
            content: data.content,
            userId: data.user_id,
            username: data.username,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            replyCount: 0
          };
        } else {
          // Yeni yorum ekle
          updatedComments.push({
            id: data.id,
            content: data.content,
            userId: data.user_id,
            username: data.username,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            replyCount: 0
          });
        }
        
        // Yorumları tarihe göre sırala
        updatedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return {
          ...prev,
          comments: updatedComments
        };
      });

      setCommentText('');
      toast.success('Yorumunuz eklendi');
    } catch (error: any) {
      console.error('Yorum eklenirken hata:', error);
      toast.error(error.message);
    }
  };

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleUpdateComment = async () => {
    if (!user || !bookmark || !editingCommentText.trim() || !editingCommentId) return;

    try {
      const response = await fetch(`/api/comments/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editingCommentText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yorum güncellenirken bir hata oluştu');
      }

      // Bookmark'ı güncelle
      setBookmark(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          comments: prev.comments?.map(comment =>
            comment.id === editingCommentId
              ? {
                  ...comment,
                  content: editingCommentText.trim(),
                  updatedAt: new Date().toISOString()
                }
              : comment
          )
        };
      });

      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Yorum güncellendi');
    } catch (error: any) {
      console.error('Yorum güncellenirken hata:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !bookmark) return;

    // Silme işlemini onayla
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Yorum silinirken bir hata oluştu');
      }

      // Bookmark'ı güncelle
      setBookmark(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          comments: prev.comments?.filter(comment => comment.id !== commentId)
        };
      });

      toast.success('Yorum silindi');
    } catch (error: any) {
      console.error('Yorum silinirken hata:', error);
      toast.error(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteBookmark = async () => {
    if (!user || !bookmark) return;

    // Silme işlemini onayla
    if (!confirm('Bu yer imini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteBookmark(bookmark.id);
      alert('Yer imi başarıyla silindi!');
      window.location.href = '/';
    } catch (error) {
      console.error('Yer imi silinirken hata:', error);
      alert('Yer imi silinirken bir hata oluştu');
    }
  };

  if (!bookmark) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Bookmark not found</h1>
            <p className="mt-2 text-gray-600">This bookmark has been deleted or doesn't exist.</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Return to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Bookmark Title and Details */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-gray-900">{bookmark.title}</h1>
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      bookmark.isFavorite ? 'text-red-500' : 'text-gray-400'
                    }`}
                  >
                    <svg className="w-6 h-6" fill={bookmark.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-base text-gray-600">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                      {bookmark.url}
                    </a>
                  </p>
                  {bookmark.description && (
                    <p className="text-base text-gray-700">{bookmark.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <Link href={`/users/${encodeURIComponent(bookmark.username)}`} className="hover:text-blue-600">
                      {bookmark.username}
                    </Link>
                    <span>•</span>
                    <span>{format(new Date(bookmark.createdAt), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span>{bookmark.favoriteCount || 0} favorites</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {bookmark.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <h2 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Comments ({bookmark.comments?.length || 0})
                </h2>
                
                {/* Add Comment Form */}
                {user && (
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-base font-medium text-blue-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment();
                        }}>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="submit"
                              disabled={!commentText.trim()}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              Add Comment
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {bookmark.comments && bookmark.comments.length > 0 ? (
                    [...bookmark.comments]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(comment => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {comment.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <Link 
                                href={`/users/${encodeURIComponent(comment.username)}`} 
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200"
                              >
                                {comment.username}
                              </Link>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {(() => {
                                    try {
                                      return comment.createdAt ? 
                                        format(new Date(comment.createdAt), 'MMM d, HH:mm') :
                                        'Tarih bilgisi yok';
                                    } catch (error) {
                                      console.error('Tarih formatlanırken hata:', error);
                                      return 'Geçersiz tarih';
                                    }
                                  })()}
                                </span>
                                {user && user.username === comment.username && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditComment(comment.id, comment.content)}
                                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                      title="Edit comment"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                                      title="Delete comment"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingCommentId === comment.id ? (
                              <div>
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={3}
                                />
                                <div className="mt-3 flex justify-end space-x-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateComment}
                                    disabled={!editingCommentText.trim()}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-base font-medium text-blue-600">
                      {bookmark.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/users/${encodeURIComponent(bookmark.username)}`}
                    className="text-base font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {bookmark.username}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {format(new Date(bookmark.createdAt), "'Joined:' MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Favorites</span>
                  <span className="text-sm text-gray-900 font-medium">{bookmark.favoriteCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Comments</span>
                  <span className="text-sm text-gray-900 font-medium">{bookmark.comments?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tags</span>
                  <span className="text-sm text-gray-900 font-medium">{bookmark.tags.length}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {bookmark.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            {user && user.id === bookmark.userId && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={handleDeleteBookmark}
                  className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                  title="Delete bookmark"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}