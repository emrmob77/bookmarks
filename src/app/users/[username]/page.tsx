'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { getBookmarks, deleteBookmark, updateBookmark, saveBookmarks, getUserProfile, toggleFavorite } from '@/lib/storage';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';

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

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  bookmarkId: string;
  createdAt: string;
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

      // Favori bookmarkları işaretle ve döndür
      const favoriteBookmarks = userFavorites.map((fav: any) => {
        const bookmark = allBookmarks.find((b: Bookmark) => b.id === fav.bookmarkId);
        if (!bookmark) return null;

        return {
          ...bookmark,
          isFavorite: true,
          favoriteCount: allFavorites.filter(f => f.bookmarkId === bookmark.id).length
        };
      }).filter(Boolean);

      return favoriteBookmarks;
    } catch (error) {
      console.error('Favori verisi yüklenirken hata:', error);
      return [];
    }
  };

  const updateUserRecord = () => {
    let allUsers: any[] = [];
    try {
      const usersData = localStorage.getItem('users');
      if (usersData) {
        allUsers = JSON.parse(usersData);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
    const userIndex = allUsers.findIndex(u => u.username === user?.username);
    if (userIndex !== -1) {
      // Mevcut kullanıcıyı güncelle
      allUsers[userIndex] = { ...allUsers[userIndex], ...user };
    } else if (user) {
      // Yeni kullanıcı kaydı ekle
      allUsers.push(user);
    }
    localStorage.setItem('users', JSON.stringify(allUsers));
  };

  const loadData = async () => {
    updateUserRecord();

    // Tüm kullanıcıları al
    let allUsers: any[] = [];
    try {
      const usersData = localStorage.getItem('users');
      if (usersData) {
        allUsers = JSON.parse(usersData);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }

    // Profil sayfasındaki kullanıcıyı bul
    const profile = allUsers.find(u => u.username === username);
    setUserProfile(profile || null);

    // Tüm yer imlerini al
    const allBookmarks = await getBookmarks();
    
    // Kullanıcının kendi yer imleri
    const userBookmarks = allBookmarks.filter(b => b.username === username && (b.isPublic || isOwnProfile));

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

    // Bookmark'ları favori durumları ile işaretle
    const markedBookmarks = userBookmarks.map(bookmark => ({
      ...bookmark,
      isFavorite: user ? allFavorites.some(fav => fav.bookmarkId === bookmark.id && fav.userId === user.id) : false,
      favoriteCount: allFavorites.filter(fav => fav.bookmarkId === bookmark.id).length
    }));

    setBookmarks(markedBookmarks);

    // Kullanıcının yorum yaptığı yer imleri
    const bookmarksWithUserComments = allBookmarks.filter(bookmark => 
      bookmark.comments?.some(comment => comment.username === username)
    );
    setBookmarksWithComments(bookmarksWithUserComments);

    // İstatistikleri güncelle
    const profileUserId = profile?.id;
    const userFavoriteBookmarks = profileUserId ? 
      allFavorites.filter(fav => fav.userId === profileUserId) : [];

    setUserStats({
      totalBookmarks: userBookmarks.length,
      publicBookmarks: userBookmarks.filter(b => b.isPublic).length,
      privateBookmarks: userBookmarks.filter(b => !b.isPublic).length,
      favorites: userFavoriteBookmarks.length,
      joinedAt: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR') : '-',
      totalComments: bookmarksWithUserComments.reduce((total, bookmark) => 
        total + (bookmark.comments?.filter(comment => comment.username === username).length || 0), 0
      )
    });

    // After obtaining the profile from local storage
    if (profile) {
      // Update profile with social media fields from authUser if missing
      profile.website = profile.website || profileUserId?.website;
      profile.twitter = profile.twitter || profileUserId?.twitter;
      profile.github = profile.github || profileUserId?.github;
      profile.bio = profile.bio || profileUserId?.bio;
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { profile, stats } = await getUserProfile(username);
        setUserProfile(profile);
        setUserStats({
          totalBookmarks: stats.totalBookmarks,
          publicBookmarks: stats.publicBookmarks,
          privateBookmarks: stats.privateBookmarks,
          favorites: stats.favorites,
          totalComments: stats.totalComments,
          joinedAt: format(new Date(profile.createdAt), 'dd MMM yyyy')
        });

        // Kullanıcının bookmarklarını getir
        const allBookmarks = await getBookmarks();
        const userBookmarks = allBookmarks.filter((b: Bookmark) => 
          b.username === username && (b.isPublic || isOwnProfile)
        );
        setBookmarks(userBookmarks);

        // Kullanıcının favorilerini getir
        const favorites = await getUserFavorites();
        setFavoriteBookmarks(favorites);

        // Kullanıcının yorumlu bookmarklarını getir
        const bookmarksWithComments = userBookmarks.filter((b: Bookmark) => b.comments && b.comments.length > 0);
        setBookmarksWithComments(bookmarksWithComments);
      } catch (err: any) {
        setError(err.message);
        console.error('Profil yüklenirken hata:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username, isOwnProfile]);

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

  const handleAddComment = async (bookmarkId: string, commentText: string) => {
    if (!user) return;

    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId
        ? {
            ...bookmark,
            comments: [
              ...(bookmark.comments || []),
              {
                id: Math.random().toString(36).substr(2, 9),
                userId: user.id,
                username: user.username,
                text: commentText,
                bookmarkId: bookmarkId,
                createdAt: new Date().toISOString()
              } as Comment
            ]
          }
        : bookmark
    );
    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);
  };

  const handleTagClick = (tagName: string) => {
    // Tag'e tıklandığında yapılacak işlemler
    window.location.href = `/tags/${encodeURIComponent(tagName)}`;
  };

  const processBookmarksWithComments = (bookmarks: Bookmark[]) => {
    return bookmarks.map(bookmark => ({
      ...bookmark,
      comments: bookmark.comments?.sort((a: Comment, b: Comment) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));
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

    switch (activeTab) {
      case 'bookmarks':
        return (
          <BookmarkList
            bookmarks={sortBookmarks(bookmarks)}
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
            bookmarks={sortBookmarks(favoriteBookmarks)}
            onRemove={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
            onTogglePinned={isOwnProfile ? handleTogglePinned : undefined}
            onAddComment={handleAddComment}
            onTagClick={handleTagClick}
          />
        );
      case 'comments':
        const userComments = processBookmarksWithComments(bookmarksWithComments).flatMap(bookmark => 
          (bookmark.comments || [])
            .filter(comment => comment.username === username)
            .map(comment => ({
              ...comment,
              bookmark: {
                id: bookmark.id,
                title: bookmark.title,
                url: bookmark.url,
                tags: bookmark.tags,
                username: bookmark.username,
                description: bookmark.description
              }
            }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
          <div className="space-y-4">
            {userComments.length > 0 ? (
              userComments.map(comment => (
                <div key={comment.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex flex-col space-y-3">
                    {/* Yer İmi Bilgileri */}
                    <div className="flex items-start space-x-3 pb-3 border-b border-gray-200">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <Link
                            href={comment.bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium block truncate"
                          >
                            {comment.bookmark.title}
                          </Link>
                          <span className="text-sm text-gray-500">
                            Added by:{' '}
                            <Link href={`/users/${encodeURIComponent(comment.bookmark.username)}`} className="text-blue-600 hover:text-blue-800">
                              {comment.bookmark.username}
                            </Link>
                          </span>
                        </div>
                        <a 
                          href={comment.bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-700 truncate block mt-1"
                        >
                          {comment.bookmark.url}
                        </a>
                        {/* Tagler */}
                        {comment.bookmark.tags && comment.bookmark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {renderTagList(comment.bookmark.tags)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Yorum İçeriği */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {comment.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700">{comment.text}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {format(new Date(comment.createdAt), 'd MMMM yyyy, HH:mm')}
                        </div>
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
                <h3 className="mt-2 text-base font-medium text-gray-900">No comments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This user hasn't made any comments yet.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Layout>
      {userProfile && !userProfile.isApproved && (
        <div className="p-4 bg-yellow-100 text-yellow-900">
          Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sağ Taraf - Tab İçeriği */}
          <div className="lg:col-span-3">
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