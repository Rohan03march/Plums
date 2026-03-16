'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  User as UserIcon, 
  Shield, 
  ShieldOff, 
  Coins, 
  Eye,
  IndianRupee,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';

interface User {
  id: string;
  displayName?: string;
  username?: string;
  role: 'man' | 'woman';
  coins: number;
  allTimeEarnings?: number;
  totalCalls?: number;
  talkTime?: number;
  rating?: number;
  phone: string;
  isOnline: boolean;
  isBlocked?: boolean;
  avatar?: string;
}

export default function UserTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'man' | 'woman' | 'blocked'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
                          u.username?.toLowerCase().includes(search.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'blocked') return matchesSearch && u.isBlocked;
    return matchesSearch && u.role === (filter === 'man' ? 'man' : 'woman');
  });

  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    setLoading(userId);
    try {
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBlocked: !currentStatus }),
      });
      
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setLoading(null);
    }
  };

  const addCoins = async (userId: string) => {
    const amount = prompt('Enter amount of coins to add:');
    if (!amount || isNaN(Number(amount))) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/users/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: Number(amount) }),
      });
      
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: u.coins + Number(amount) } : u));
      }
    } catch (error) {
      console.error('Error adding coins:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, username or phone..." 
            className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 w-full transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          {(['all', 'man', 'woman', 'blocked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">User Profile</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Account Stats</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 overflow-hidden">
                          {user.avatar ? (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#0a0f18] ${user.isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white group-hover:text-pink-500 transition-colors">
                            {user.displayName || 'Unnamed User'}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${user.role === 'man' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs">@{user.username || 'user'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-orange-400 font-bold text-sm">
                        <Coins className="w-3.5 h-3.5" />
                        {user.coins.toLocaleString()} <span className="text-[10px] opacity-70 italic">Current</span>
                      </div>
                      
                      {user.role === 'woman' && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                            <IndianRupee className="w-2.5 h-2.5" />
                            {user.allTimeEarnings || 0} Total
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                            <Eye className="w-2.5 h-2.5" />
                            {user.totalCalls || 0} Calls
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold">
                            <Clock className="w-2.5 h-2.5" />
                            {user.talkTime || 0} Min
                          </div>
                           <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                            <Shield className="w-2.5 h-2.5" />
                            {(user.rating || 0).toFixed(1)} ⭐
                          </div>
                        </div>
                      )}
                      
                      <p className="text-gray-500 text-[10px] font-medium">{user.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl w-fit text-xs font-bold ring-1 ring-red-500/20">
                        <Shield className="w-3.5 h-3.5" />
                        Suspended
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl w-fit text-xs font-bold ring-1 ring-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => addCoins(user.id)}
                         className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all"
                         title="Add Coins"
                       >
                         <Coins className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => toggleBlock(user.id, !!user.isBlocked)}
                         className={`p-2 rounded-xl transition-all ${user.isBlocked ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                         title={user.isBlocked ? "Unblock" : "Block User"}
                       >
                         {user.isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                       </button>
                       <div className="h-4 w-[1px] bg-white/10 mx-1" />
                       <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                         <Eye className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
