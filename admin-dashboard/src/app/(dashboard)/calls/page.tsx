import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { PhoneCall, User, Clock, ShieldCheck, Video, Mic } from 'lucide-react';

async function getCallHistory() {
  try {
    if (!adminDb) return [];
    
    // We fetch from CallHistory collection
    const snapshot = await adminDb.collection("CallHistory")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
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

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Call Type</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Participants</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Duration & Cost</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Security</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className={`p-2.5 rounded-xl ${call.type === 'video' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                         {call.type === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                       </div>
                       <span className="text-sm font-bold text-white capitalize">{call.type} Call</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-bold">Caller: {call.callerId.substring(0, 8)}...</span>
                        <span className="text-pink-500 text-xs font-bold">To: {call.receiverName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {call.duration}
                      </div>
                      <p className="text-orange-400 text-xs font-bold">{call.cost} Coins</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-green-500/70 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Encrypted
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-500 text-xs font-medium">
                      {call.timestamp?.toDate ? call.timestamp.toDate().toLocaleString() : new Date(call.timestamp).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {calls.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-gray-600">
                <PhoneCall className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-medium">No call logs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
