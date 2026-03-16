import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee, Clock } from 'lucide-react';

async function getTransactions() {
  try {
    if (!adminDb) return [];
    
    const snapshot = await adminDb.collection("Transactions")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <IndianRupee className="w-4 h-4 text-pink-500" />
          <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Financial Records</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Transaction History</h1>
        <p className="text-gray-500 mt-1">Audit trail of all financial events, deposits, and earnings.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Reference / ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">User</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-gray-500">{tx.id}</span>
                      <span className="text-white font-medium text-xs mt-1 uppercase tracking-wider">{tx.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-400 text-sm font-medium">{tx.userId}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg ${tx.type === 'deposit' || tx.type === 'call_earn' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {tx.type === 'deposit' || tx.type === 'call_earn' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                       </div>
                       <div>
                         <p className={`font-bold ${tx.type === 'deposit' || tx.type === 'call_earn' ? 'text-green-500' : 'text-red-500'}`}>
                           {tx.type === 'deposit' || tx.type === 'call_earn' ? '+' : '-'}{tx.coins.toLocaleString()} <span className="text-[10px] opacity-70">Gold</span>
                         </p>
                         <p className="text-[10px] text-gray-500 font-medium">₹{tx.amountInRupees}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      tx.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                      tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-gray-600">
                <IndianRupee className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-medium">No transactions recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
