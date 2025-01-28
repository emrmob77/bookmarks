import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { UserFavorite } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesListProps {
  favorites: UserFavorite[];
  onRemoveFavorite: (bookmarkId: string) => void;
}

export default function FavoritesList({ favorites, onRemoveFavorite }: FavoritesListProps) {
  const { user } = useAuth();

  // Favorileri tarihe göre sırala (en yeni en üstte)
  const sortedFavorites = [...favorites].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedFavorites.length > 0 ? (
        sortedFavorites.map(favorite => (
          <div key={favorite.bookmarkId} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-medium text-gray-900">
                  {favorite.bookmarkData.title}
                </h2>
                
                <a
                  href={favorite.bookmarkData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1 block"
                >
                  {favorite.bookmarkData.url}
                </a>

                {favorite.bookmarkData.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {favorite.bookmarkData.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {favorite.bookmarkData.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                  {favorite.userId === user?.id && (
                    <button
                      onClick={() => onRemoveFavorite(favorite.bookmarkId)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from favorites"
                    >
                      <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="mr-2">
                    Saved from{' '}
                    <Link href={`/users/${encodeURIComponent(favorite.bookmarkData.username)}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {favorite.bookmarkData.username}
                    </Link>
                  </span>
                  <time dateTime={favorite.createdAt}>
                    {format(new Date(favorite.createdAt), 'MMM d, yyyy')}
                  </time>
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-2 text-base font-medium text-gray-900">No favorites yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            You can add bookmarks to your favorites.
          </p>
        </div>
      )}
    </div>
  );
} 