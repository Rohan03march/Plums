import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { PhoneCall, User, Clock, ShieldCheck, Video, Mic } from 'lucide-react';
import CallHistoryTable from '@/components/CallHistoryTable';

async function getCallHistory() {
  try {
    if (!adminDb) return [];
    
    // We fetch from CallHistory collection
    const snapshot = await adminDb.collection("CallHistory")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
      };
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return [];
  }
}

export default async function CallsPage() {
  const calls = await getCallHistory();

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <PhoneCall className="w-4 h-4 text-pink-500" />
          <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Communication Logs</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Call History</h1>
        <p className="text-gray-500 mt-1">Review all audio and video interactions between members.</p>
      </header>

      <CallHistoryTable initialCalls={calls} />
    </div>
  );
}
