'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/../lib/firebase';
import { 
  Users, 
  PhoneCall, 
  IndianRupee, 
  Coins,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Stats {
  users: number;
  calls: number;
  revenue: number;
  gold: number;
  connected: boolean;
}

export default function RealtimeStats({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    // 1. Listen to Users for count and total gold
    const usersQuery = query(collection(db, 'Users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      let totalGold = 0;
      snapshot.docs.forEach(doc => {
        totalGold += (doc.data().coins || 0);
      });
      setStats(prev => ({ 
        ...prev, 
        users: snapshot.size, 
        gold: totalGold,
        connected: true 
      }));
    });

    // 2. Listen to CallHistory for count
    const callsQuery = query(collection(db, 'CallHistory'));
    const unsubCalls = onSnapshot(callsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, calls: snapshot.size }));
    });

    // 3. Listen to Transactions for revenue
    const txQuery = query(collection(db, 'Transactions'), where('status', '==', 'success'));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      let totalRevenue = 0;
      snapshot.docs.forEach(doc => {
        totalRevenue += (doc.data().amountInRupees || 0);
      });
      setStats(prev => ({ ...prev, revenue: totalRevenue }));
    });

    return () => {
      unsubUsers();
      unsubCalls();
      unsubTx();
    };
  }, []);

  const cards = [
    { 
      title: 'Total Users', 
      value: stats.users.toLocaleString(), 
      change: 'Live', 
      isUp: true, 
      icon: Users,
      color: 'pink'
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.revenue.toLocaleString()}`, 
      change: 'Real-time', 
      isUp: true, 
      icon: IndianRupee,
      color: 'blue'
    },
    { 
      title: 'Calls Completed', 
      value: stats.calls.toLocaleString(), 
      change: 'Live Feed', 
      isUp: true, 
      icon: PhoneCall,
      color: 'orange' 
    },
    { 
      title: 'Total Gold (Circulating)', 
      value: stats.gold.toLocaleString(), 
      change: 'Live Sync', 
      isUp: true, 
      icon: Coins,
      color: 'yellow'
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse outline outline-4 outline-green-500/20" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
            Live Real-time Feed Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-white/20 transition-all relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-${card.color}-500/10 transition-all`} />
            
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${card.color}-500/10 text-${card.color}-500`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${card.isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {card.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </div>
            </div>

            <p className="text-gray-500 text-sm font-medium">{card.title}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{card.value}</h3>
          </div>
        ))}
      </div>
    </>
  );
}
