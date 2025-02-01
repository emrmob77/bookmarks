'use client';

import { ReactNode, useEffect } from 'react';
import { getBookmarks, getUsers } from '@/lib/storage';

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    const syncInitialData = async () => {
      try {
        // Yer imlerini senkronize et
        const bookmarks = getBookmarks();
        await fetch('/api/sync/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookmarks)
        });

        // Kullanıcıları senkronize et
        const users = getUsers();
        await fetch('/api/sync/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        });
      } catch (error) {
        console.error('Başlangıç senkronizasyonu hatası:', error);
      }
    };

    syncInitialData();
  }, []);

  return <>{children}</>;
} 