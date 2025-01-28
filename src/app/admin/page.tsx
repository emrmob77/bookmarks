'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookmarks: 0,
    totalTags: 0,
    recentUsers: [],
    popularTags: []
  });

  useEffect(() => {
    const calculateStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        
        // Calculate tag counts
        const tagCounts = bookmarks.reduce((acc: { [key: string]: number }, bookmark: any) => {
          bookmark.tags.forEach((tag: string) => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {});

        // Convert tag counts to array and sort
        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get recent users
        const recentUsers = [...users]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalUsers: users.length,
          totalBookmarks: bookmarks.length,
          totalTags: Object.keys(tagCounts).length,
          recentUsers,
          popularTags: sortedTags
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };

    calculateStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Bookmarks</h2>
          <p className="text-3xl font-bold">{stats.totalBookmarks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Tags</h2>
          <p className="text-3xl font-bold">{stats.totalTags}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          <div className="space-y-4">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Popular Tags</h2>
          <div className="space-y-4">
            {stats.popularTags.map((tag) => (
              <div key={tag.name} className="flex items-center justify-between">
                <span className="font-medium">{tag.name}</span>
                <span className="text-gray-500">{tag.count} bookmarks</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 