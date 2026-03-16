'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, Lock, Loader2, IndianRupee } from 'lucide-react';
import { db } from '@/../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    const q = query(collection(db, 'Admins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/admins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add admin');

      setStatus('success');
      setEmail('');
      setPassword('');
      setAdding(false);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const handleDeleteAdmin = async (adminEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${adminEmail} from admins?`)) return;

    try {
      await deleteDoc(doc(db, 'Admins', adminEmail));
      // Note: This only removes them from Firestore authorize list. 
      // They stay in Auth but cannot log in anymore due to our check.
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] text-purple-500 font-bold uppercase tracking-widest">Access Control</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Management</h1>
          <p className="text-gray-500 mt-1">Manage users with administrative privileges.</p>
        </div>
        
        <button 
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add New Admin
        </button>
      </header>

      {adding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Invite Admin</h2>
            <p className="text-gray-500 text-sm mb-8">This will create a new account and grant dashboard access.</p>

            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Temporary Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-xl">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Admin Detail</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Added Date</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{admin.id}</span>
                        <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">Authorized Admin</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {admin.role || 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-500 text-xs font-medium">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'System Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
