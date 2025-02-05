'use client';

import { SessionProvider } from 'next-auth/react';

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Her 5 dakikada bir oturumu kontrol et
      refetchOnWindowFocus={true} // Pencere odaklandığında oturumu kontrol et
    >
      {children}
    </SessionProvider>
  );
}
