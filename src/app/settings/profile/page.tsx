'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      updateProfile(formData);
      setMessage('Profil başarıyla güncellendi');
      setIsEditing(false);

      // 3 saniye sonra mesajı kaldır
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Profil güncellenirken bir hata oluştu');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg">
            {/* Başlık */}
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profil Ayarları
                </h3>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setMessage('');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'İptal' : 'Düzenle'}
                </button>
              </div>
            </div>

            {/* Başarı/Hata Mesajı */}
            {message && (
              <div className={`px-4 py-3 ${message.includes('hata') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="px-4 py-5 space-y-6 sm:p-6">
                {/* Profil Fotoğrafı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Profil Fotoğrafı
                  </label>
                  <div className="mt-2 flex items-center space-x-5">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {formData.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Değiştir
                      </button>
                    )}
                  </div>
                </div>

                {/* Kullanıcı Adı */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Kullanıcı Adı
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* E-posta */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Biyografi */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Hakkımda
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Sosyal Medya */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Sosyal Medya</h4>
                  
                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        name="website"
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        disabled={!isEditing}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Twitter */}
                  <div>
                    <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                      Twitter
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="twitter"
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        disabled={!isEditing}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* GitHub */}
                  <div>
                    <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                      GitHub
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="github"
                        id="github"
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        disabled={!isEditing}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kaydet Butonu */}
              {isEditing && (
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
} 