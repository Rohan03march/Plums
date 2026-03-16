import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { 
  Users, 
  PhoneCall, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';

async function getDashboardStats() {
  try {
    if (!adminDb) return { users: 0, calls: 0, revenue: 0, txCount: 0, connected: false };

    const [usersSnap, callsSnap, txSnap] = await Promise.all([
      adminDb.collection("Users").count().get(),
      adminDb.collection("CallHistory").count().get(),
      adminDb.collection("Transactions").where("status", "==", "success").get()
    ]);

    const totalRevenue = txSnap.docs.reduce((acc, doc) => acc + (doc.data().amountInRupees || 0), 0);
    
    return {
      users: usersSnap.data().count,
      calls: callsSnap.data().count,
      revenue: totalRevenue,
      txCount: txSnap.size,
      connected: true,
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return { users: 0, calls: 0, revenue: 0, txCount: 0, connected: false };
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const cards = [
    { 
      title: 'Total Users', 
      value: stats.users.toLocaleString(), 
      change: '+12.5%', 
      isUp: true, 
      icon: Users,
      color: 'pink'
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.revenue.toLocaleString()}`, 
      change: '+18.2%', 
      isUp: true, 
      icon: IndianRupee,
      color: 'blue'
    },
    { 
      title: 'Calls Completed', 
      value: stats.calls.toLocaleString(), 
      change: '-2.4%', 
      isUp: false, 
      icon: PhoneCall,
      color: 'orange' 
    },
    { 
      title: 'Active Sessions', 
      value: '24', 
      change: '+4', 
      isUp: true, 
      icon: Activity,
      color: 'green'
    },
  ];

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

      {/* Stats Grid */}
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

      <DashboardCharts />

      {/* Recent Activity Section */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
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
