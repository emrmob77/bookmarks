'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SiteSettings {
  title: string;
  description: string;
  keywords: string;
  favicon: string;
  logo: string;
  googleAnalytics: {
    measurementId: string;
    trackingCode: string;
  };
  searchConsole: {
    verificationCode: string;
  };
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
  googleAnalytics: {
    measurementId: '',
    trackingCode: ''
  },
  searchConsole: {
    verificationCode: ''
  },
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
          setSettings({
            ...defaultSettings,
            ...JSON.parse(storedSettings)
          });
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
      // First save to localStorage
      localStorage.setItem('siteSettings', JSON.stringify(settings));

      // Then call the API
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Site Settings</h1>

      {message.text && (
        <div className={`p-3 mb-4 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold mb-3">General Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={e => handleChange('root', 'title', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={settings.description}
                onChange={e => handleChange('root', 'description', e.target.value)}
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <input
                type="text"
                value={settings.keywords}
                onChange={e => handleChange('root', 'keywords', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold mb-3">Google Analytics Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement ID</label>
              <input
                type="text"
                value={settings.googleAnalytics.measurementId}
                onChange={e => handleChange('googleAnalytics', 'measurementId', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Example: G-XXXXXXXXXX</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Code</label>
              <textarea
                value={settings.googleAnalytics.trackingCode}
                onChange={e => handleChange('googleAnalytics', 'trackingCode', e.target.value)}
                rows={3}
                placeholder="<!-- Google Analytics Code -->"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Paste your full Google Analytics tracking code here</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold mb-3">Search Console Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={settings.searchConsole.verificationCode}
                onChange={e => handleChange('searchConsole', 'verificationCode', e.target.value)}
                placeholder="<meta name='google-site-verification' content='XXXXX'>"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Enter the full meta tag from Google Search Console</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold mb-3">Social Links</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
              <input
                type="url"
                value={settings.socialLinks.twitter}
                onChange={e => handleChange('socialLinks', 'twitter', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
              <input
                type="url"
                value={settings.socialLinks.github}
                onChange={e => handleChange('socialLinks', 'github', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={settings.socialLinks.linkedin}
                onChange={e => handleChange('socialLinks', 'linkedin', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold mb-3">Email Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
              <input
                type="email"
                value={settings.emailSettings.fromEmail}
                onChange={e => handleChange('emailSettings', 'fromEmail', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={settings.emailSettings.smtpHost}
                onChange={e => handleChange('emailSettings', 'smtpHost', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="text"
                value={settings.emailSettings.smtpPort}
                onChange={e => handleChange('emailSettings', 'smtpPort', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
              <input
                type="text"
                value={settings.emailSettings.smtpUser}
                onChange={e => handleChange('emailSettings', 'smtpUser', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
              <input
                type="password"
                value={settings.emailSettings.smtpPass}
                onChange={e => handleChange('emailSettings', 'smtpPass', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 