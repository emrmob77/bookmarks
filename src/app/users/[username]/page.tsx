'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { getBookmarks, deleteBookmark, updateBookmark, saveBookmarks, getUserProfile, toggleFavorite } from '@/lib/storage';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark, Comment } from '@/types';
import { toast } from 'react-hot-toast';
import SearchBar from '@/components/SearchBar';
import { v4 as uuidv4 } from 'uuid';

type TabType = 'bookmarks' | 'favorites' | 'comments';

interface UserProfile {
  username: string;
  email: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  createdAt: string;
  isApproved?: boolean;
}

interface UserFavorite {
  bookmarkId: string;
  userId: string;
}

export default function UserProfile() {
  const params = useParams();
  const { user } = useAuth();
  const username = decodeURIComponent(params.username as string);
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favoriteBookmarks, setFavoriteBookmarks] = useState<Bookmark[]>([]);
  const [bookmarksWithComments, setBookmarksWithComments] = useState<Bookmark[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStats, setUserStats] = useState({
    totalBookmarks: 0,
    publicBookmarks: 0,
    privateBookmarks: 0,
    favorites: 0,
    joinedAt: '-',
    totalComments: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcının kendi profilinde olup olmadığını kontrol et
  const isOwnProfile = user && user.username === username;

  const getUserFavorites = async () => {
    try {
      // Profil sayfasındaki kullanıcının ID'sini bul
      const usersData = localStorage.getItem('users');
      const allUsers = usersData ? JSON.parse(usersData) : [];
      const profileUser = allUsers.find((u: any) => u.username === username);
      
      if (!profileUser) return [];

      // Kullanıcının favorilerini al
      const userFavoritesKey = `userFavorites_${profileUser.id}`;
      const storedFavorites = localStorage.getItem(userFavoritesKey);
      if (!storedFavorites) return [];

      const userFavorites = JSON.parse(storedFavorites);

      // Tüm bookmarkları al
      const allBookmarks = await getBookmarks();

      // Favori bookmarkları işaretle ve döndür
      return allBookmarks
        .filter(bookmark => userFavorites.some((fav: UserFavorite) => fav.bookmarkId === bookmark.id))
        .map(bookmark => ({
          ...bookmark,
          isFavorite: true
        }));
    } catch (error) {
      console.error('Favori verisi yüklenirken hata:', error);
      return [];
    }
  };

  const handleAddComment = async (bookmarkId: string, commentText: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookmarkId,
          content: commentText,
          clientCommentId: uuidv4()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Yorum eklenirken bir hata oluştu');
      }

      const newComment = await response.json();

      // Sadece ilgili bookmark'ı güncelle
      setBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => {
          if (bookmark.id === bookmarkId) {
            return {
              ...bookmark,
              comments: [...(bookmark.comments || []), newComment]
            };
          }
          return bookmark;
        })
      );

      // Yorumlu bookmarkları güncelle
      setBookmarksWithComments(prevBookmarks => {
        const bookmarkExists = prevBookmarks.some(b => b.id === bookmarkId);
        if (!bookmarkExists) {
          const bookmark = bookmarks.find(b => b.id === bookmarkId);
          if (bookmark) {
            return [...prevBookmarks, {
              ...bookmark,
              comments: [newComment]
            }];
          }
        }
        return prevBookmarks.map(bookmark => {
          if (bookmark.id === bookmarkId) {
            return {
              ...bookmark,
              comments: [...(bookmark.comments || []), newComment]
            };
          }
          return bookmark;
        });
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        throw new Error('Kullanıcı profili yüklenemedi');
      }
      
      const data = await response.json();
      setUserProfile(data.profile);
      setUserStats(prev => ({
        ...prev,
        totalBookmarks: data.stats.totalBookmarks,
        publicBookmarks: data.stats.publicBookmarks,
        privateBookmarks: data.stats.privateBookmarks,
        favorites: data.stats.favorites,
        totalComments: data.stats.totalComments,
        joinedAt: data.profile.createdAt ? format(new Date(data.profile.createdAt), 'dd MMM yyyy') : '-'
      }));
      
      return data.profile;
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      throw new Error('Profil yüklenemedi');
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Kullanıcı profilini yükle
      await loadUserProfile();
      
      // Tüm yer imlerini tek seferde al
      const allBookmarks = await getBookmarks();
      
      // Kullanıcının kendi yer imleri
      const userBookmarks = allBookmarks.filter(b => b.username === username && (b.isPublic || isOwnProfile));

      // Kullanıcının yorum yaptığı yer imleri
      const bookmarksWithUserComments = allBookmarks.filter(bookmark => 
        bookmark.comments?.some(comment => 
          comment.username === username && 
          (bookmark.isPublic || isOwnProfile)
        )
      );

      // Kullanıcının favorilerini getir
      const favorites = await getUserFavorites();

      // State'leri güncelle
      setFavoriteBookmarks(favorites);
      setBookmarks(userBookmarks.map(bookmark => ({
        ...bookmark,
        isFavorite: favorites.some(fav => fav.id === bookmark.id),
        favoriteCount: favorites.filter(fav => fav.id === bookmark.id).length
      })));
      setBookmarksWithComments(bookmarksWithUserComments);

    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError(error instanceof Error ? error.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const loadDataWithDelay = async () => {
      if (!username || isLoading) return;

      try {
        setIsLoading(true);
        setError(null);
        await loadData();
      } catch (err) {
        if (mounted) {
          console.error('Veri yükleme hatası:', err);
          setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
      } finally {
        if (mounted) {
          loadingTimeout = setTimeout(() => {
            setIsLoading(false);
          }, 100);
        }
      }
    };

    loadDataWithDelay();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [username, user]);

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) {
      alert('Bu işlemi yapabilmek için giriş yapmalısınız!');
      return;
    }

    // Silme işlemini onayla
    if (!confirm('Bu yer imini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteBookmark(bookmarkId);
      
      // State'i güncelle
      setBookmarks(prevBookmarks => prevBookmarks.filter(b => b.id !== bookmarkId));
      setFavoriteBookmarks(prevFavorites => prevFavorites.filter(b => b.id !== bookmarkId));
      setBookmarksWithComments(prevComments => prevComments.filter(b => b.id !== bookmarkId));
      
      // Başarı mesajı göster
      alert('Yer imi başarıyla silindi!');
    } catch (error) {
      console.error('Yer imi silinirken hata:', error);
      alert('Yer imi silinirken bir hata oluştu');
    }
  };

  const handleToggleFavorite = async (bookmarkId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
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
      await loadData();
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
      setError(error instanceof Error ? error.message : 'Favori işlemi gerçekleştirilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePinned = async (bookmarkId: string) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId ? { ...bookmark, isPinned: !bookmark.isPinned } : bookmark
    );
    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);
  };

  const handleTagClick = (tagName: string) => {
    // Tag'e tıklandığında yapılacak işlemler
    window.location.href = `/tags/${encodeURIComponent(tagName)}`;
  };

  const processBookmarksWithComments = (bookmarks: Bookmark[]) => {
    return bookmarks.map(bookmark => {
      if (!bookmark.comments) return bookmark;
      
      const sortedComments = [...bookmark.comments].sort((a: Comment, b: Comment) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return {
        ...bookmark,
        comments: sortedComments
      };
    });
  };

  const renderTagList = (tags: string[]) => {
    return tags.map((tag: string) => (
      <Link
        key={tag}
        href={`/tags/${encodeURIComponent(tag)}`}
        className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
      >
        #{tag}
      </Link>
    ));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  const renderTabContent = () => {
    const sortBookmarks = (bookmarksToSort: Bookmark[]) => {
      return [...bookmarksToSort].sort((a, b) => {
        // Önce pinlenmiş olanları göster
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Sonra tarihe göre sırala
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    };

    const filterBookmarks = (bookmarksToFilter: Bookmark[]) => {
      return bookmarksToFilter.filter(bookmark => {
        const searchContent = `${bookmark.title} ${bookmark.description} ${bookmark.tags.join(' ')}`.toLowerCase();
        return searchContent.includes(searchTerm);
      });
    };

    switch (activeTab) {
      case 'bookmarks':
        return (
          <BookmarkList
            bookmarks={sortBookmarks(filterBookmarks(bookmarks))}
            onRemove={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
            onTogglePinned={isOwnProfile ? handleTogglePinned : undefined}
            onAddComment={handleAddComment}
            onTagClick={handleTagClick}
          />
        );
      case 'favorites':
        return (
          <BookmarkList
            bookmarks={sortBookmarks(filterBookmarks(favoriteBookmarks))}
            onRemove={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
            onTogglePinned={isOwnProfile ? handleTogglePinned : undefined}
            onAddComment={handleAddComment}
            onTagClick={handleTagClick}
          />
        );
      case 'comments':
        const userComments = processBookmarksWithComments(filterBookmarks(bookmarksWithComments))
          .flatMap(bookmark => {
            const comments = bookmark.comments || [];
            return comments
              .filter(comment => comment.username === username)
              .map(comment => ({
                ...comment,
                bookmark: {
                  id: bookmark.id,
                  title: bookmark.title,
                  url: bookmark.url,
                  tags: bookmark.tags,
                  username: bookmark.username,
                  description: bookmark.description,
                  isPublic: bookmark.isPublic
                }
              }));
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log('İşlenmiş yorumlar:', userComments);

        return (
          <div className="space-y-4">
            {userComments.length > 0 ? (
              userComments.map(comment => (
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
                        {comment.bookmark.isPublic && (
                          <Link
                            href={`/bookmark/${comment.bookmarkId}`}
                            className="mt-1 text-blue-600 hover:text-blue-800 block"
                          >
                            {comment.bookmark.title}
                          </Link>
                        )}
                        <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="mt-2 text-base font-medium text-gray-900">Henüz yorum yok</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Bu kullanıcı henüz yorum yapmamış.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sağ Taraf - Tab İçeriği */}
          <div className="lg:col-span-3">
            {/* Arama Alanı */}
            <SearchBar onSearch={handleSearch} />
            
            {/* Tab Başlıkları */}
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
                  Bookmarks
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favorites
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Comments
                </div>
              </button>
            </div>

            {/* Tab İçeriği */}
            {renderTabContent()}
          </div>

          {/* Sağ Taraf - Kullanıcı Bilgileri */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{username}</h2>
                <p className="mt-1 text-sm text-gray-500">Joined: {userStats.joinedAt}</p>
              </div>

              {userProfile?.bio && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">About</h3>
                  <p className="mt-2 text-sm text-gray-500">{userProfile.bio}</p>
                </div>
              )}

              {(userProfile?.website || userProfile?.twitter || userProfile?.github) && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Links</h3>
                  <div className="mt-4 space-y-4">
                    {userProfile?.website && (
                      <a
                        href={userProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </a>
                    )}
                    {userProfile?.twitter && (
                      <a
                        href={`https://twitter.com/${userProfile.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                        Twitter
                      </a>
                    )}
                    {userProfile?.github && (
                      <a
                        href={`https://github.com/${userProfile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48C19.137 20.107 22 16.373 22 11.969 22 6.463 17.522 2 12 2z"/>
                        </svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Stats</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Bookmarks</span>
                    <span className="text-sm font-medium text-gray-900">{userStats.totalBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Public</span>
                    <span className="text-sm font-medium text-gray-900">{userStats.publicBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Private</span>
                    <span className="text-sm font-medium text-gray-900">{userStats.privateBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Favorites</span>
                    <span className="text-sm font-medium text-gray-900">{userStats.favorites}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Comments</span>
                    <span className="text-sm font-medium text-gray-900">{userStats.totalComments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </Layout>
  );
} 