import { NextResponse } from 'next/server';
import { adminDb } from '@/../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { payoutId, status, userId, coins } = await request.json();

    if (!payoutId || !status || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const payoutRef = adminDb.collection('PayoutRequests').doc(payoutId);
    const payoutDoc = await payoutRef.get();

    if (!payoutDoc.exists) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    const currentData = payoutDoc.data();
    if (currentData?.status !== 'pending') {
      return NextResponse.json({ error: 'Payout already processed' }, { status: 400 });
    }

    const transactionId = currentData?.transactionId;

    // Prepare Batch for Transaction safety
    const batch = adminDb.batch();

    // 1. Update Payout Status
    batch.update(payoutRef, {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. If Rejected, Refund coins to user
    if (status === 'rejected') {
      const userRef = adminDb.collection('Users').doc(userId);
      batch.update(userRef, {
        coins: admin.firestore.FieldValue.increment(coins)
      });
      
      if (transactionId) {
        const txRef = adminDb.collection('Transactions').doc(transactionId);
        batch.update(txRef, {
          status: 'failed',
          description: `Payout #${payoutId.substring(0, 5)} rejected`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Legacy: also record a refund transaction
        const txRef = adminDb.collection('Transactions').doc();
        batch.set(txRef, {
          userId,
          coins,
          amountInRupees: coins / 10,
          type: 'refund',
          status: 'success',
          description: `Payout #${payoutId.substring(0, 5)} rejected`,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } else if (status === 'approved') {
       if (transactionId) {
         const txRef = adminDb.collection('Transactions').doc(transactionId);
         batch.update(txRef, {
           status: 'success',
           description: `Payout #${payoutId.substring(0, 5)} approved`,
           updatedAt: admin.firestore.FieldValue.serverTimestamp()
         });
       } else {
         // Legacy: Record a success withdrawal transaction
         const txRef = adminDb.collection('Transactions').doc();
         batch.set(txRef, {
           userId,
           coins,
           amountInRupees: coins / 10,
           type: 'withdrawal',
           status: 'success',
           description: `Payout #${payoutId.substring(0, 5)} approved`,
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         });
       }
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
