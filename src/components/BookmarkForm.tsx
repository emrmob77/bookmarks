'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, NewBookmark } from '@/types';
import { getUsers } from '@/lib/storage';
import { getBookmarks } from '@/lib/storage';

interface MetadataResponse {
  title?: string;
  description?: string;
  image?: string;
  error?: string;
}

interface BookmarkFormProps {
  onAdd: (bookmark: NewBookmark) => void;
  editingBookmark?: Bookmark;
  onUpdate?: (bookmark: Bookmark) => void;
  onCancel?: () => void;
}

export default function BookmarkForm({ onAdd, editingBookmark, onUpdate, onCancel }: BookmarkFormProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with editing bookmark data
  useEffect(() => {
    if (editingBookmark) {
      setUrl(editingBookmark.url || '');
      setTitle(editingBookmark.title || '');
      setDescription(editingBookmark.description || '');
      setTags(editingBookmark.tags?.join(', ') || '');
      setIsPublic(editingBookmark.isPublic || true);
    }
  }, [editingBookmark]);

  // Automatically fetch metadata when URL changes
  useEffect(() => {
    if (url && !editingBookmark) {
      const timeoutId = setTimeout(() => {
        fetchMetadata();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [url, editingBookmark]);

  const fetchMetadata = async () => {
    if (!url) return;

    setIsLoading(true);
    setError('');

    try {
      // URL formatını kontrol et
      let validUrl = url;
      if (!url.match(/^https?:\/\//i)) {
        validUrl = `https://${url}`;
      }

      // URL'nin geçerli olup olmadığını kontrol et
      try {
        new URL(validUrl);
      } catch (e) {
        setError('Invalid URL format');
        return;
      }

      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(validUrl)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 saniye timeout
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error) {
            setError(data.error);
          } else {
            setError('Failed to fetch URL data');
          }
          return;
        }

        if (!data.title && !data.description) {
          setError('No metadata found');
          return;
        }

        setTitle(data.title || '');
        setDescription(data.description || '');
        setImage(data.image || '');
      } catch (error) {
        if (error.name === 'AbortError') {
          setError('Request timeout - please try again');
        } else if (!navigator.onLine) {
          setError('No internet connection');
        } else {
          setError('Failed to fetch URL data');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Kullanıcı ayarlarını kontrol et
      const users = getUsers();
      const currentUser = users.find((u: any) => u.username === user.username);
      
      if (!currentUser?.settings?.isApproved) {
        setError('Your account is not approved yet. Please wait for admin approval.');
        return;
      }

      // Eğer düzenleme modu değilse (yeni ekleme ise) limit kontrolü yap
      if (!editingBookmark) {
        const userBookmarks = getBookmarks().filter((b: { username: string }) => b.username === user.username);
        if (userBookmarks.length >= (currentUser?.settings?.maxBookmarks || 10)) {
          if (currentUser?.settings?.isPremium) {
            setError('You have reached your premium account bookmark limit. Please contact admin to increase your limit.');
          } else {
            setError('You have reached your free account bookmark limit. Upgrade to premium to add more bookmarks.');
          }
          return;
        }
      }

      const bookmarkData = {
        title,
        url,
        description,
        image,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        isPublic,
        isPinned: false,
        isFavorite: false,
        favoriteCount: 0,
        comments: []
      };

      if (editingBookmark && onUpdate) {
        onUpdate({ ...editingBookmark, ...bookmarkData });
      } else if (onAdd) {
        onAdd({
          ...bookmarkData,
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          createdAt: new Date().toISOString()
        } as NewBookmark);
      }

      resetForm();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      setError('An error occurred while adding the bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setImage('');
    setTags('');
    setIsPublic(true);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
        <div className="mt-1 flex">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g., https://example.com"
            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
            required
            pattern="^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$"
            title="Please enter a valid URL (e.g., https://example.com)"
          />
          {!editingBookmark && (
            <button
              type="button"
              onClick={fetchMetadata}
              className={`ml-2 inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
              title="Auto-fetch URL metadata"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          )}
        </div>
        {isLoading && (
          <p className="mt-1 text-sm text-gray-500">Fetching URL metadata...</p>
        )}
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Enter description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Enter tags, separated by commas"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isPublic ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={isPublic}
        >
          <span className="sr-only">Toggle visibility</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
              isPublic ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="ml-3 text-sm font-medium text-gray-700">
          {isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {editingBookmark && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            editingBookmark ? 'Update' : 'Add'
          )}
        </button>
      </div>
    </form>
  );
} 