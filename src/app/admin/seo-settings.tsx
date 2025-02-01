import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SeoSettings() {
  const [robotsTxt, setRobotsTxt] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.role === 'admin') {
      router.push('/');
      return;
    }

    loadSeoSettings();
  }, [user, router]);

  const loadSeoSettings = () => {
    try {
      setIsLoading(true);
      setError(null);
      const existingSettings = localStorage.getItem('seoSettings');
      if (existingSettings) {
        const settings = JSON.parse(existingSettings);
        setRobotsTxt(settings.robotsTxt || '');
        setSitemapUrl(settings.sitemapUrl || '');
      }
    } catch (error) {
      console.error('SEO ayarları yüklenirken hata:', error);
      setError('Ayarlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage('');

      const settings = { robotsTxt, sitemapUrl };
      localStorage.setItem('seoSettings', JSON.stringify(settings));
      setMessage('SEO ayarları başarıyla kaydedildi!');
    } catch (error) {
      console.error('SEO ayarları kaydedilirken hata:', error);
      setError('Ayarlar kaydedilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.role === 'admin') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">SEO Ayarları</h1>
        
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

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              robots.txt İçeriği:
            </label>
            <textarea
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="User-agent: *&#10;Allow: /"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitemap URL:
            </label>
            <input
              type="text"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/sitemap.xml"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 