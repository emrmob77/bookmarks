import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import fs from 'fs';
import path from 'path';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settingsPath = path.join(process.cwd(), 'public', 'settings.json');
    let settings = {
      title: 'Bookmarks',
      description: 'Your personal bookmark manager',
      keywords: 'bookmarks, bookmark manager, links'
    };

    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(settingsData);
    }

    return {
      metadataBase: new URL('http://localhost:3000'),
      title: {
        default: settings.title,
        template: '%s'
      },
      description: settings.description,
      keywords: settings.keywords,
      openGraph: {
        title: settings.title,
        description: settings.description,
      },
      twitter: {
        title: settings.title,
        description: settings.description,
      }
    };
  } catch (error) {
    console.error('Error reading settings:', error);
    return {
      metadataBase: new URL('http://localhost:3000'),
      title: {
        default: 'Bookmarks',
        template: '%s'
      },
      description: 'Your personal bookmark manager'
    };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
