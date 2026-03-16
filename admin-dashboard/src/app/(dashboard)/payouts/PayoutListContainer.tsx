'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/../lib/firebase';
import { Search, Clock, CheckCircle2, XCircle, Banknote, QrCode, Building2, User } from 'lucide-react';
import PayoutActions from './PayoutActions';

interface PayoutListContainerProps {
  initialPayouts: any[];
}

export default function PayoutListContainer({ initialPayouts }: PayoutListContainerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [payouts, setPayouts] = useState<any[]>(initialPayouts || []);

  useEffect(() => {
    const q = query(collection(db, 'PayoutRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payoutsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toLocaleString() || 'N/A',
          updatedAt: data.updatedAt?.toDate().toLocaleString() || null
        };
      });
      setPayouts(payoutsData);
    }, (error) => {
      console.error("PayoutList Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchesStatus = activeTab === 'all' || p.status === activeTab;
      const matchesSearch = p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.details?.upiId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.details?.accountNumber?.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [payouts, activeTab, searchQuery]);

  const stats = {
    all: payouts.length,
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    rejected: payouts.filter(p => p.status === 'rejected').length,
  };

  const getAvatarPath = (avatarId: string | undefined) => {
    if (!avatarId) return null;
    const id = String(avatarId);
    if (id.startsWith('boy_')) return `/avatars/3d_${id}.png`;
    if (id.startsWith('girl_')) return `/avatars/3d_avatar_${id.split('_')[1]}.png`;
    if (!isNaN(Number(id))) return `/avatars/3d_avatar_${id}.png`;
    return null;
  };

  const tabs = [
    { id: 'all', label: 'All Requests', icon: Banknote, color: 'text-gray-400' },
    { id: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-500' },
    { id: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-green-500' },
    { id: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5">
        <div className="flex gap-2 p-1 bg-black/20 rounded-2xl border border-white/5 self-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'text-gray-500'}`} />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === tab.id ? 'bg-white/10' : 'bg-white/5'
              }`}>
                {stats[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
          <input
            type="text"
            placeholder="Search creator or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all placeholder:text-gray-600 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
        {filteredPayouts.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Banknote className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No matching requests</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Creator</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Method</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayouts.map((payout: any) => (
                <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform overflow-hidden">
                        {getAvatarPath(payout.userAvatar) ? (
                          <img 
                            src={getAvatarPath(payout.userAvatar)!} 
                            alt={payout.userName} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold">{payout.userName}</p>
                        <p className="text-gray-500 text-xs font-medium">{payout.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-white text-lg font-black italic">₹{payout.amount}</p>
                      <p className="text-pink-500/80 text-[10px] font-black uppercase tracking-widest">{payout.coins} Coins</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {payout.method === 'upi' ? (
                        <>
                          <QrCode className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">UPI</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Bank</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1 max-w-xs">
                      {payout.method === 'upi' ? (
                        <p className="text-gray-300 text-sm font-medium bg-white/5 px-3 py-1 rounded-lg border border-white/5 inline-block">
                          {payout.details?.upiId}
                        </p>
                      ) : (
                        <div className="text-xs space-y-0.5 text-gray-400">
                          <p><span className="text-gray-600 font-bold uppercase tracking-tighter">Acc:</span> <span className="text-gray-300">{payout.details?.accountNumber}</span></p>
                          <p><span className="text-gray-600 font-bold uppercase tracking-tighter">IFSC:</span> <span className="text-gray-300">{payout.details?.ifscCode}</span></p>
                          <p><span className="text-gray-600 font-bold uppercase tracking-tighter">Bank:</span> <span className="text-gray-300">{payout.details?.bankName}</span></p>
                          <p><span className="text-gray-600 font-bold uppercase tracking-tighter">Holder:</span> <span className="text-gray-300">{payout.details?.accountHolder}</span></p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      payout.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      payout.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {payout.status === 'pending' && <Clock className="w-3 h-3" />}
                      {payout.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {payout.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <PayoutActions payout={payout} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
