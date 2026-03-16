'use client';

import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white/5 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md">
      <h2 className="text-xl font-bold text-white">{title}</h2>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 w-64 transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#0a0f18]" />
          </button>
          
          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className="text-right">
              <p className="text-sm font-bold text-white group-hover:text-pink-500 transition-colors">{user?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Master Admin</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-pink-500/20 flex items-center justify-center group-hover:border-pink-500/50 transition-all overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-5 h-5 text-pink-500" />
               )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
