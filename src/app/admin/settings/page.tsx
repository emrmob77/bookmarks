'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SiteSettings {
  title: string;
  description: string;
  keywords: string;
  favicon: string;
  logo: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  emailSettings: {
    fromEmail: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
  };
}

const defaultSettings: SiteSettings = {
  title: 'Bookmarks',
  description: 'Your personal bookmark manager',
  keywords: 'bookmarks, bookmark manager, links',
  favicon: '/favicon.ico',
  logo: '/logo.png',
  socialLinks: {
    twitter: '',
    github: '',
    linkedin: ''
  },
  emailSettings: {
    fromEmail: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: ''
  }
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();

  useEffect(() => {
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem('siteSettings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Önce localStorage'a kaydet
      localStorage.setItem('siteSettings', JSON.stringify(settings));

      // Sonra API'yi çağır
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      router.refresh();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (section: string, field: string, value: string) => {
    if (section === 'root') {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setSettings(prev => {
        const sectionData = prev[section as keyof SiteSettings];
        if (typeof sectionData === 'object' && sectionData !== null) {
          return {
            ...prev,
            [section]: {
              ...sectionData,
              [field]: value
            }
          };
        }
        return prev;
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Site Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={e => handleChange('root', 'title', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={settings.description}
                onChange={e => handleChange('root', 'description', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Keywords</label>
              <input
                type="text"
                value={settings.keywords}
                onChange={e => handleChange('root', 'keywords', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Twitter</label>
              <input
                type="url"
                value={settings.socialLinks.twitter}
                onChange={e => handleChange('socialLinks', 'twitter', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GitHub</label>
              <input
                type="url"
                value={settings.socialLinks.github}
                onChange={e => handleChange('socialLinks', 'github', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
              <input
                type="url"
                value={settings.socialLinks.linkedin}
                onChange={e => handleChange('socialLinks', 'linkedin', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Email Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From Email</label>
              <input
                type="email"
                value={settings.emailSettings.fromEmail}
                onChange={e => handleChange('emailSettings', 'fromEmail', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
              <input
                type="text"
                value={settings.emailSettings.smtpHost}
                onChange={e => handleChange('emailSettings', 'smtpHost', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
              <input
                type="text"
                value={settings.emailSettings.smtpPort}
                onChange={e => handleChange('emailSettings', 'smtpPort', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP User</label>
              <input
                type="text"
                value={settings.emailSettings.smtpUser}
                onChange={e => handleChange('emailSettings', 'smtpUser', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
              <input
                type="password"
                value={settings.emailSettings.smtpPass}
                onChange={e => handleChange('emailSettings', 'smtpPass', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 