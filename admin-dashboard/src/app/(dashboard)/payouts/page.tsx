import React from 'react';
import { adminDb } from '@/../lib/firebaseAdmin';
import { Banknote, Clock, CheckCircle2, XCircle, User, CreditCard, Building2, Landmark, QrCode } from 'lucide-react';
import PayoutActions from './PayoutActions';
import PayoutListContainer from './PayoutListContainer';

async function getPayoutRequests() {
  try {
    if (!adminDb) return [];
    const snapshot = await adminDb.collection('PayoutRequests').orderBy('createdAt', 'desc').get();
    
    // Enrich with user data if missing (legacy or more up-to-date info)
    const payouts = await Promise.all(snapshot.docs.map(async (payoutDoc) => {
      const data = payoutDoc.data();
      let userName = data.userName;
      let userAvatar = data.userAvatar;

      if ((!userName || userName === 'Anonymous' || !userAvatar) && data.userId && adminDb) {
        const userDoc = await adminDb.collection('Users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userName && userName !== 'Anonymous' ? userName : (userData?.displayName || userData?.name || 'Anonymous');
          userAvatar = userAvatar || userData?.avatar;
        }
      }

      return {
        id: payoutDoc.id,
        ...data,
        userName,
        userAvatar,
        createdAt: data.createdAt?.toDate().toLocaleString() || 'N/A',
        updatedAt: data.updatedAt?.toDate().toLocaleString() || null
      };
    }));

    return payouts;
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return [];
  }
}

const getAvatarPath = (avatarId: string | undefined) => {
  if (!avatarId) return null;
  const id = String(avatarId);
  if (id.startsWith('boy_')) return `/avatars/3d_${id}.png`;
  if (id.startsWith('girl_')) return `/avatars/3d_avatar_${id.split('_')[1]}.png`;
  // Fallback for just numbers
  if (!isNaN(Number(id))) return `/avatars/3d_avatar_${id}.png`;
  return null;
}

export default async function PayoutsPage() {
  const payouts = await getPayoutRequests();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Payout Management</h1>
          <p className="text-gray-400 font-medium">Review and process withdrawal requests from creators</p>
        </div>
      </div>

      <PayoutListContainer initialPayouts={payouts} />
    </div>
  );
}
