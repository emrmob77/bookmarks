'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SeoSettings {
  robotsTxt: string;
  sitemapUrl: string;
}

export default function SeoSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SeoSettings>({
    robotsTxt: '',
    sitemapUrl: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }

    loadSettings();
  }, [user, router]);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('seoSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Varsayılan robots.txt içeriği
        setSettings({
          robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${window.location.origin}/sitemap.xml`,
          sitemapUrl: `${window.location.origin}/sitemap.xml`
        });
      }
    } catch (error) {
      console.error('SEO ayarları yüklenirken hata:', error);
      setError('SEO ayarları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('seoSettings', JSON.stringify(settings));
      setMessage('SEO ayarları başarıyla kaydedildi');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('SEO ayarları kaydedilirken hata:', error);
      setError('SEO ayarları kaydedilemedi');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">SEO Ayarları</h1>
        <p className="mt-2 text-sm text-gray-500">
          robots.txt ve sitemap.xml ayarlarını buradan yönetebilirsiniz
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="robotsTxt" className="block text-sm font-medium text-gray-700">
                robots.txt İçeriği
              </label>
              <div className="mt-1">
                <textarea
                  id="robotsTxt"
                  rows={8}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Arama motorları için robots.txt dosyasının içeriğini buradan düzenleyebilirsiniz.
              </p>
            </div>

            <div>
              <label htmlFor="sitemapUrl" className="block text-sm font-medium text-gray-700">
                Sitemap URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="sitemapUrl"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={settings.sitemapUrl}
                  onChange={(e) => setSettings({ ...settings, sitemapUrl: e.target.value })}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Sitemap dosyanızın URL'sini buraya girin.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 