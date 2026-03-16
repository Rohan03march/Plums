import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee, Clock } from 'lucide-react';
import TransactionTable from '@/components/TransactionTable';

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

      <TransactionTable initialTransactions={transactions} />
    </div>
  );
}
