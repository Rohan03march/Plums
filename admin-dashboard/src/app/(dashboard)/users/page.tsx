import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import UserTable from '@/components/UserTable';
import { Users as UsersIcon, Plus } from 'lucide-react';

async function getUsers() {
  try {
    if (!adminDb) return [];
    
    // Fetch all users from Firestore
    const snapshot = await adminDb.collection("Users").get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName || data.name || 'Anonymous',
        email: data.email || '',
        photoURL: data.photoURL || data.avatar || null,
        role: data.role || 'user',
        coins: data.coins || 0,
        allTimeEarnings: data.allTimeEarnings || 0,
        totalCalls: data.totalCalls || 0,
        talkTime: data.talkTime || 0,
        rating: data.rating || 0,
        isBlocked: data.isBlocked || false,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : (data.lastSeen || null),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null)
      };
    }) as any[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-4 h-4 text-pink-500" />
            <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">User Database</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Member Directory</h1>
          <p className="text-gray-500 mt-1">Manage user access, moderation and financial balances.</p>
        </div>
        
        <button className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Member
        </button>
      </header>

      <UserTable initialUsers={users} />
    </div>
  );
}
