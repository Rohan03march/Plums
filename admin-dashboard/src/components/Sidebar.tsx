'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  CreditCard, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Coins,
  Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: CreditCard, label: 'Transactions', href: '/transactions' },
  { icon: Phone, label: 'Calls', href: '/calls' },
  { icon: Coins, label: 'Payouts', href: '/payouts' },
  { icon: ShieldCheck, label: 'Admins', href: '/admins' },
  { icon: Coins, label: 'Plans', href: '/plans' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-72 bg-[#0a0f18] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/20">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CallApp</h1>
            <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Premium CRM</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-gradient-to-r from-pink-500/10 to-transparent border-l-2 border-pink-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-pink-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-pink-500" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all group"
        >
          <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
