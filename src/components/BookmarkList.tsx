'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import type { Bookmark, Comment } from '@/types';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';
import { v4 as uuidv4 } from 'uuid';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onRemove: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onTogglePinned?: (id: string) => Promise<void>;
  onEdit?: (bookmark: Bookmark) => void;
  onAddComment: (bookmarkId: string, commentText: string) => Promise<void>;
  onTagClick?: (tagName: string) => void;
}

export default function BookmarkList({ bookmarks, onRemove, onToggleFavorite, onTogglePinned, onEdit, onAddComment, onTagClick }: BookmarkListProps) {
  const { user } = useAuth();
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formClientId, setFormClientId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleCommentClick = (bookmarkId: string) => {
    if (!user) {
      setError('Please login to add a comment');
      return;
    }
    setActiveCommentId(activeCommentId === bookmarkId ? null : bookmarkId);
    setCommentText('');
    setError(null);
    setFormClientId(uuidv4());
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, bookmarkId: string) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      setIsSubmitting(true);
      await handleCommentSubmit(bookmarkId);
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (bookmarkId: string) => {
    if (!commentText.trim() || !user || !formClientId) {
      setError('Lütfen bir yorum yazın');
      return;
    }

    if (loading[bookmarkId]) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [bookmarkId]: true }));
      
      console.log('Yorum gönderiliyor:', {
        bookmarkId,
        content: commentText.trim(),
        clientCommentId: formClientId
      });

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookmarkId,
          content: commentText.trim(),
          clientCommentId: formClientId
        })
      });

      const data = await response.json();
      console.log('Sunucu yanıtı:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Yorum eklenirken bir hata oluştu');
      }

      setCommentText('');
      setError(null);
      setActiveCommentId(null);
      setFormClientId(null);
      
      if (onAddComment) {
        onAddComment(bookmarkId, data);
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      setError(error.message || 'Yorum eklenirken bir hata oluştu');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [bookmarkId]: false }));
    }
  };

  const handleAction = async (action: (id: string) => Promise<void>, id: string) => {
    try {
      setLoading(prev => ({ ...prev, [id]: true }));
      await action(id);
    } catch (error: any) {
      console.error('Action failed:', error);
      toast.error(error.message || 'Action failed');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleUpdateComment = async (bookmarkId: string) => {
    if (!user || !editingCommentText.trim() || !editingCommentId) return;

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
      if (onAddComment) {
        onAddComment(bookmarkId, data);
      }

      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Yorum güncellendi');
    } catch (error: any) {
      console.error('Yorum güncellenirken hata:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (bookmarkId: string, commentId: string) => {
    if (!user) return;

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

      if (onAddComment) {
        onAddComment(bookmarkId, { deleted: true, commentId });
      }

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

  return (
    <div className="space-y-4">
      {bookmarks.map(bookmark => (
        <div
          key={bookmark.id}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          {bookmark.isPinned && (
            <div className="flex items-center text-sm text-blue-600 mb-4">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Pinned by {bookmark.username}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    {bookmark.title}
                  </h2>
                  {!bookmark.isPublic && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {onTogglePinned && (
                    <button
                      onClick={() => handleAction(onTogglePinned, bookmark.id)}
                      className={`text-gray-400 hover:text-blue-500 transition-colors flex items-center ${
                        bookmark.isPinned ? 'text-blue-500' : ''
                      }`}
                      disabled={loading[bookmark.id]}
                    >
                      <svg className="w-5 h-5" fill={bookmark.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  )}
                  {user && user.id !== bookmark.userId && (
                    <button
                      onClick={() => onToggleFavorite(bookmark.id)}
                      className={`text-gray-400 hover:text-red-500 transition-colors flex items-center ${
                        bookmark.isFavorite ? 'text-red-500' : ''
                      }`}
                      disabled={!user || loading[bookmark.id]}
                      title={!user ? 'Please login to add to favorites' : bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="w-5 h-5" fill={bookmark.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className={`ml-1 text-sm ${bookmark.isFavorite ? 'text-red-500' : 'text-gray-500'}`}>
                        {bookmark.favoriteCount || 0}
                      </span>
                    </button>
                  )}
                  <button
                    className={`text-gray-400 hover:text-blue-500 transition-colors flex items-center ${
                      activeCommentId === bookmark.id ? 'text-blue-500' : ''
                    }`}
                    onClick={() => handleCommentClick(bookmark.id)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    {bookmark.comments && bookmark.comments.length > 0 && (
                      <span className="ml-1 text-sm">{bookmark.comments.length}</span>
                    )}
                  </button>
                  {/* Düzenleme ve Silme İkonları */}
                  {user && (user.id === bookmark.userId || user.role === 'admin') && onEdit && (
                    <button
                      onClick={() => onEdit(bookmark)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Düzenle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {user && (user.id === bookmark.userId || user.role === 'admin') && (
                    <button
                      onClick={() => handleAction(onRemove, bookmark.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Sil"
                      disabled={loading[bookmark.id]}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 mt-1 block"
              >
                {bookmark.url}
              </a>

              {bookmark.description && (
                <p className="mt-2 text-sm text-gray-600">
                  {bookmark.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {bookmark.tags.map(tag => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      onClick={(e) => {
                        if (onTagClick) {
                          e.preventDefault();
                          onTagClick(tag);
                        }
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">
                    Added by{' '}
                    <Link href={`/users/${encodeURIComponent(bookmark.username)}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {bookmark.username}
                    </Link>
                  </span>
                  <Link href={`/bookmark/${bookmark.id}`}>
                    <time dateTime={bookmark.createdAt}>
                      {format(new Date(bookmark.createdAt), 'MMM d, yyyy')}
                    </time>
                  </Link>
                </div>
              </div>

              {activeCommentId === bookmark.id && (
                <div className="mt-4">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isSubmitting) return;
                      
                      try {
                        setIsSubmitting(true);
                        await handleCommentSubmit(bookmark.id);
                      } catch (error) {
                        // Hata zaten handleCommentSubmit içinde işleniyor
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="flex flex-col space-y-2"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        setError(null); // Input değiştiğinde hata mesajını temizle
                      }}
                      onKeyPress={(e) => handleKeyPress(e, bookmark.id)}
                      placeholder="Write your comment..."
                      className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={loading[bookmark.id] || isSubmitting}
                    />
                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading[bookmark.id] || isSubmitting || !commentText.trim()}
                      >
                        {loading[bookmark.id] || isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeCommentId === bookmark.id && bookmark.comments && bookmark.comments.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Comments</h3>
                  {(bookmark.comments || []).map((comment) => {
                    const typedComment = comment as Comment;
                    return (
                      <div key={typedComment.id} className="flex space-x-3 text-sm">
                        <div className="flex-shrink-0">
                          <Link href={`/users/${encodeURIComponent(typedComment.username)}`} className="font-medium text-gray-900">
                            {typedComment.username}
                          </Link>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingCommentId === typedComment.id ? (
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
                                  İptal
                                </button>
                                <button
                                  onClick={() => handleUpdateComment(bookmark.id)}
                                  disabled={!editingCommentText.trim()}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  Kaydet
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-500">{typedComment.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-400">
                                  {(() => {
                                    try {
                                      return typedComment.createdAt ? 
                                        format(new Date(typedComment.createdAt), 'dd MMM yyyy HH:mm') :
                                        'Tarih bilgisi yok';
                                    } catch (error) {
                                      console.error('Tarih formatlanırken hata:', error);
                                      return 'Geçersiz tarih';
                                    }
                                  })()}
                                </p>
                                {user && user.username === typedComment.username && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditComment(typedComment.id, typedComment.content)}
                                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                      title="Yorumu düzenle"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(bookmark.id, typedComment.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                                      title="Yorumu sil"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {bookmarks.length === 0 && (
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
          <h3 className="mt-2 text-base font-medium text-gray-900">No bookmarks</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new bookmark.
          </p>
        </div>
      )}
    </div>
  );
} 