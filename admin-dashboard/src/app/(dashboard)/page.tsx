import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import {
  TrendingUp,
  Activity
} from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';
import RealtimeStats from '@/components/RealtimeStats';

async function getDashboardStats() {
  try {
    if (!adminDb) return { users: 0, calls: 0, revenue: 0, gold: 0, txCount: 0, connected: false };

    const [usersCountSnap, callsCountSnap, txSnap] = await Promise.all([
      adminDb.collection("Users").count().get(),
      adminDb.collection("CallHistory").count().get(),
      adminDb.collection("Transactions").where("status", "==", "success").get()
    ]);

    const totalRevenue = txSnap.docs.reduce((acc, doc) => acc + (doc.data().amountInRupees || 0), 0);

    // Sum total gold from all users
    const allUsersSnap = await adminDb.collection("Users").select("coins").get();
    const totalGold = allUsersSnap.docs.reduce((acc, doc) => acc + (doc.data().coins || 0), 0);

    return {
      users: usersCountSnap.data().count,
      calls: callsCountSnap.data().count,
      revenue: totalRevenue,
      gold: totalGold,
      txCount: txSnap.size,
      connected: true,
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return { users: 0, calls: 0, revenue: 0, gold: 0, txCount: 0, connected: false };
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Global Analytics</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Real-time performance metrics and user engagement insights.</p>
      </header>

      <RealtimeStats initialStats={stats} />

      <DashboardCharts />

      {/* Recent Activity Section */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Live System Status</h3>
            <p className="text-gray-500 text-sm">Monitor database connectivity and background processes.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className={`w-2 h-2 rounded-full animate-pulse ${stats.connected ? 'bg-green-500 outline outline-4 outline-green-500/20' : 'bg-red-500 outline outline-4 outline-red-500/20'}`} />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {stats.connected ? 'Cloud Connected' : 'Connection Failed'}
            </span>
          </div>
        </div>

        {!stats.connected ? (
           <div className="p-12 text-center bg-red-500/5 rounded-3xl border border-red-500/10">
             <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <Activity className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-bold text-white mb-2">Firebase Configuration Incomplete</h4>
             <p className="text-gray-400 max-w-sm mx-auto text-sm">
               The server-side Firebase Admin SDK is missing credentials. Please check your `.env` settings to enable real-time data flow.
             </p>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-12 h-12 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-6" />
            <p className="text-gray-400 font-medium">Listening for real-time events across the network...</p>
          </div>
        )}
      </section>
    </div>
  );
}
