'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAdmin } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">Initializing CRM...</p>
        </div>
      </div>
    );
  }

  // If not admin and not on login page, the AuthContext will redirect.
  // This is a safety render check.
  if (!isAdmin && pathname !== '/login') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f18] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle(pathname)} />
        <main className="flex-1 overflow-y-auto outline-none">
          <div className="p-8 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string) {
  switch (pathname) {
    case '/': return 'Dashboard Overview';
    case '/users': return 'User Management';
    case '/transactions': return 'Financial Records';
    case '/calls': return 'Communication Logs';
    case '/settings': return 'System Settings';
    default: return 'CallApp Admin';
  }
}
