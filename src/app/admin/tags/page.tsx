'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types';
import { useRouter } from 'next/navigation';

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Tag>>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTags = () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const tagCounts = bookmarks.reduce((acc: { [key: string]: number }, bookmark: any) => {
          bookmark.tags.forEach((tag: string) => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {});

        const storedTags = JSON.parse(localStorage.getItem('tags') || '[]');
        const updatedTags = Object.keys(tagCounts).map(name => {
          const existingTag = storedTags.find((t: Tag) => t.name === name) || {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name,
            description: '',
            metaTitle: '',
            metaDescription: '',
            createdAt: new Date().toISOString()
          };
          return {
            ...existingTag,
            bookmarkCount: tagCounts[name]
          };
        });

        localStorage.setItem('tags', JSON.stringify(updatedTags));
        setTags(updatedTags);

        // API'yi çağırarak tags.json'ı güncelle
        updateTagsFile(updatedTags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };

    loadTags();
  }, []);

  const updateTagsFile = async (updatedTags: Tag[]) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTags),
      });

      if (!response.ok) {
        throw new Error('Failed to update tags file');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating tags file:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData(tag);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    try {
      const updatedTags = tags.map(tag => 
        tag.id === selectedTag.id ? { ...tag, ...formData } : tag
      );

      // Önce localStorage'a kaydet
      localStorage.setItem('tags', JSON.stringify(updatedTags));
      setTags(updatedTags);

      // Sonra API'yi çağır
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTags),
      });

      if (!response.ok) {
        throw new Error('Failed to update tags');
      }

      setIsEditing(false);
      setSelectedTag(null);
      setFormData({});

      // Sayfayı yeniden yükle
      router.refresh();

      // Başarı mesajı göster
      setMessage({ type: 'success', text: 'Tag updated successfully' });
    } catch (error) {
      console.error('Error updating tag:', error);
      setMessage({ type: 'error', text: 'Failed to update tag' });
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      localStorage.setItem('tags', JSON.stringify(updatedTags));
      setTags(updatedTags);

      // API'yi çağırarak tags.json'ı güncelle
      await updateTagsFile(updatedTags);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tag Management</h1>

      {isEditing ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Tag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Meta Description</label>
              <textarea
                value={formData.metaDescription || ''}
                onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTag(null);
                  setFormData({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookmarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                    {tag.metaTitle && (
                      <div className="text-sm text-gray-500">SEO: {tag.metaTitle}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{tag.description || '-'}</div>
                    {tag.metaDescription && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        SEO: {tag.metaDescription}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tag.bookmarkCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 