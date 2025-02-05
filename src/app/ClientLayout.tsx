'use client';

import { ReactNode, useEffect } from 'react';
import { getBookmarks } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from "@/components/ui/spinner";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    const syncInitialData = async () => {
      try {
        // Oturum yükleniyorsa bekle
        if (status === 'loading' || loading) {
          return;
        }

        // Ana sayfa veya auth sayfalarında kontrol yapma
        if (pathname === '/' || pathname?.startsWith('/signin') || pathname?.startsWith('/signup')) {
          return;
        }

        // Dashboard ve diğer korumalı sayfalar için kontrol
        if (pathname?.startsWith('/dashboard')) {
          if (!user) {
            router.replace('/signin');
            return;
          }

          // Kullanıcı girişi varsa yer imlerini getir
          await getBookmarks();
        }
      } catch (error: any) {
        console.error('Veri yükleme hatası:', error);
        if (error.message === 'Unauthorized' || error.message === 'Lütfen giriş yapın') {
          router.replace('/signin');
        }
      }
    };

    syncInitialData();
  }, [user, router, pathname, status, loading]);

  // Oturum yükleniyorsa loading göster
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}