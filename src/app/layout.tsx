import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import ClientLayout from './ClientLayout';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Bookmarks App',
    description: 'Your personal bookmark manager',
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Bookmarks App',
      description: 'Your personal bookmark manager',
      type: 'website',
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
            <Toaster position="bottom-right" />
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
