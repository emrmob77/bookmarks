'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';
import { getBookmarks, saveBookmarks } from '@/lib/storage';

export default function TagPage() {
  const params = useParams();
  const name = params.name as string;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      const loadedBookmarks = await getBookmarks();
      setBookmarks(loadedBookmarks);
    };
    fetchBookmarks();
  }, []);

  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.tags.includes(name) && (bookmark.isPublic || bookmark.isOwner)
  );

  const handleRemoveBookmark = async (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);
  };

  const handleToggleFavorite = async (id: string) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === id
        ? { ...bookmark, isFavorite: !bookmark.isFavorite }
        : bookmark
    );
    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);
  };

  const handleAddComment = async (bookmarkId: string, commentText: string) => {
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.id === bookmarkId
        ? {
            ...bookmark,
            comments: [
              ...(bookmark.comments || []),
              {
                id: Date.now().toString(),
                userId: 'current-user',
                username: 'current-user',
                text: commentText,
                createdAt: new Date().toISOString(),
                bookmarkId
              }
            ]
          }
        : bookmark
    );
    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Bookmarks tagged with "{decodeURIComponent(name)}"
              </h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {filteredBookmarks.length > 0 ? (
                <BookmarkList
                  bookmarks={filteredBookmarks}
                  onRemove={handleRemoveBookmark}
                  onToggleFavorite={handleToggleFavorite}
                  onAddComment={handleAddComment}
                  onTagClick={(tag) => {
                    window.location.href = `/tags/${encodeURIComponent(tag)}`;
                  }}
                />
              ) : (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookmarks found</h3>
                  <p className="mt-1 text-sm text-gray-500">No bookmarks have been tagged with "{decodeURIComponent(name)}" yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tag Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Bookmarks</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">{filteredBookmarks.length}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Public Bookmarks</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {filteredBookmarks.filter(b => b.isPublic).length}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Private Bookmarks</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {filteredBookmarks.filter(b => !b.isPublic).length}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Related Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      filteredBookmarks.flatMap(b => b.tags)
                        .filter(t => t !== name)
                    )).slice(0, 10).map(relatedTag => (
                      <a
                        key={relatedTag}
                        href={`/tags/${encodeURIComponent(relatedTag)}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {relatedTag}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 