import { NextResponse } from 'next/server';
import { adminDb } from '@/../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || amount === undefined) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Increment coins field
    await adminDb.collection('Users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(amount)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
