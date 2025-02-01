import { useState, useEffect } from 'react';

export default function SeoSettings() {
  const [robotsTxt, setRobotsTxt] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const existingSettings = localStorage.getItem('seoSettings');
    if (existingSettings) {
      const settings = JSON.parse(existingSettings);
      setRobotsTxt(settings.robotsTxt || '');
      setSitemapUrl(settings.sitemapUrl || '');
    }
  }, []);

  const handleSave = () => {
    const settings = { robotsTxt, sitemapUrl };
    localStorage.setItem('seoSettings', JSON.stringify(settings));
    setMessage('SEO ayarları kaydedildi!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>SEO Ayarları</h1>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>robots.txt İçeriği:</label>
        <textarea
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          rows={10}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>Sitemap URL:</label>
        <input
          type="text"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <button onClick={handleSave} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Kaydet
      </button>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
} 