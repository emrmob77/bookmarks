import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // LocalStorage'dan kullanıcı verilerini kontrol et
        const usersData = localStorage.getItem('users');
        if (!usersData) {
          setIsAdmin(false);
          return;
        }

        const users = JSON.parse(usersData);
        const currentUser = users.find((u: any) => u.username === user?.username);
        
        if (currentUser?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin kontrolü başarısız:', error);
        setError('Yetki kontrolü yapılamadı');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [user]);

  return { isAdmin, isLoading, error };
}; 