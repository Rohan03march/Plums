import { NextResponse } from 'next/server';
import { adminDb } from '@/../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { 
      userId, 
      userName, 
      userAvatar, 
      userEmail, 
      amount, 
      coins, 
      method, 
      details 
    } = await request.json();

    if (!userId || !amount || !coins || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const userRef = adminDb.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const isWoman = userData?.role === 'woman';
    const currentGold = isWoman ? (userData?.earningBalance || 0) : (userData?.coins || 0);

    if (currentGold < coins) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Prepare Batch
    const batch = adminDb.batch();

    // 1. Create Transaction (Pending)
    const txRef = adminDb.collection('Transactions').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    batch.set(txRef, {
      userId,
      coins,
      amountInRupees: amount,
      type: 'withdrawal',
      status: 'pending',
      timestamp
    });

    // 2. Create Payout Request
    const payoutRef = adminDb.collection('PayoutRequests').doc();
    batch.set(payoutRef, {
      userId,
      userName: userName || userData?.displayName || userData?.name || 'Anonymous',
      userAvatar: userAvatar || userData?.avatar || '',
      userEmail: userEmail || userData?.phone || '',
      amount,
      coins,
      method,
      status: 'pending',
      transactionId: txRef.id,
      createdAt: timestamp,
      details
    });

    // 3. Deduct from user balance
    const userUpdates: any = {};
    if (isWoman) {
      // For creators, deduct from both Gold and INR balances
      userUpdates.earningBalance = admin.firestore.FieldValue.increment(-coins);
      userUpdates.rupeeBalance = admin.firestore.FieldValue.increment(-amount);
    } else {
      // Fallback for consumers (Men)
      userUpdates.coins = admin.firestore.FieldValue.increment(-coins);
    }
    
    batch.update(userRef, userUpdates);

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      payoutId: payoutRef.id,
      transactionId: txRef.id
    });
  } catch (error: any) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
