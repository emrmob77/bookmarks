'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Tag } from '@/types';
import BookmarkList from '@/components/BookmarkList';
import { useRouter } from 'next/navigation';

type Props = {
  name: string;
};

export default function ClientTagPage({ name }: Props) {
  const [tag, setTag] = useState<Tag | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadTagData = async () => {
      try {
        const decodedName = decodeURIComponent(name);
        
        // Etiket bilgilerini yükle
        const storedTags = JSON.parse(localStorage.getItem('tags') || '[]');
        const foundTag = storedTags.find((t: Tag) => t.name === decodedName);
        
        if (foundTag) {
          setTag(foundTag);
          console.log('Found tag in localStorage:', foundTag); // Debug için

          // API'yi çağırarak tags.json'ı güncelle
          try {
            const response = await fetch('/api/tags', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(storedTags),
            });

            if (!response.ok) {
              throw new Error('Failed to update tags file');
            }

            // Sayfayı yeniden yükle
            router.refresh();
          } catch (error) {
            console.error('Error updating tags file:', error);
          }
        } else {
          console.log('Tag not found:', decodedName); // Debug için
          setTag(null);
        }

        // Etiketle ilgili yer imlerini yükle
        const allBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const taggedBookmarks = allBookmarks.filter((bookmark: Bookmark) => 
          bookmark.tags.includes(decodedName) && bookmark.isPublic
        );
        setBookmarks(taggedBookmarks);
      } catch (error) {
        console.error('Error loading tag data:', error);
      }
    };

    loadTagData();
  }, [name, router]);

  if (!tag) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Tag not found</h1>
        <p className="text-gray-600">The tag "{decodeURIComponent(name)}" could not be found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{tag.name}</h1>
        {tag.description && (
          <p className="text-gray-600">{tag.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bookmarks with this tag</h2>
          {bookmarks.length > 0 ? (
            <BookmarkList 
              bookmarks={bookmarks}
              onRemove={() => {}}
              onToggleFavorite={() => {}}
              onAddComment={() => {}}
            />
          ) : (
            <p className="text-gray-500">No bookmarks found with this tag.</p>
          )}
        </div>
      </div>
    </div>
  );
} 