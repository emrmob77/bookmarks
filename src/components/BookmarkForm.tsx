'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, NewBookmark } from '@/types';

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
  const [error, setError] = useState('');

  // Initialize form with editing bookmark data
  useEffect(() => {
    if (editingBookmark) {
      setUrl(editingBookmark.url);
      setTitle(editingBookmark.title);
      setDescription(editingBookmark.description);
      setImage(editingBookmark.image);
      setTags(editingBookmark.tags.join(', '));
      setIsPublic(editingBookmark.isPublic);
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
      // URL'yi kontrol et ve gerekirse https:// ekle
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`;
      }

      const response = await fetch(`/api/metadata?url=${encodeURIComponent(validUrl)}`);
      const data: MetadataResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch metadata');
      }

      setTitle(data.title || '');
      setDescription(data.description || '');
      setImage(data.image || '');
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) return;

    if (!user) {
      setError('Please sign in first');
      return;
    }

    try {
      // URL'yi kontrol et ve gerekirse https:// ekle
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`;
      }

      const bookmarkData: NewBookmark = {
        url: validUrl,
        title: title || validUrl,
        description,
        image,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublic,
        userId: user.email,
        favoriteCount: 0
      };

      if (editingBookmark && onUpdate) {
        onUpdate({
          ...editingBookmark,
          ...bookmarkData,
        });
      } else {
        onAdd(bookmarkData);
        resetForm();
      }
    } catch (err) {
      console.error('Error saving bookmark:', err);
      setError(err instanceof Error ? err.message : 'Failed to save bookmark');
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
            title="Please enter a valid URL"
          />
          {!editingBookmark && (
            <button
              type="button"
              onClick={fetchMetadata}
              className={`ml-2 inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
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
          <p className="mt-1 text-sm text-gray-500">Fetching metadata...</p>
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
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        {editingBookmark && onCancel && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {editingBookmark ? 'Update' : 'Add'} Bookmark
        </button>
      </div>
    </form>
  );
} 