'use client';

import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayoutActions({ payout }: { payout: any }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    setLoading(status);
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutId: payout.id,
          status,
          userId: payout.userId,
          coins: payout.coins
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating payout status:', error);
      alert('Error updating payout status');
    } finally {
      setLoading(null);
    }
  };

  if (payout.status !== 'pending') {
    return (
      <div className="flex items-center gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-tighter">
        <span>No actions available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleStatusUpdate('approved')}
        disabled={loading !== null}
        className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 group/act"
        title="Approve Payout"
      >
        {loading === 'approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button
        onClick={() => handleStatusUpdate('rejected')}
        disabled={loading !== null}
        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 group/act"
        title="Reject Payout"
      >
        {loading === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
    </div>
  );
}
