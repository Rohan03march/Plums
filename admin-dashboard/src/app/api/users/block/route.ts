import { NextResponse } from 'next/server';
import { adminDb } from '@/../lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { userId, isBlocked } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    await adminDb.collection('Users').doc(userId).update({
      isBlocked: isBlocked
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
