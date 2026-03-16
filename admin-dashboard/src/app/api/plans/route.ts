import { NextResponse } from 'next/server';
import { adminDb } from '@/../lib/firebaseAdmin';

// GET all plans
export async function GET() {
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');
    
    const snapshot = await adminDb.collection('GoldPlans').orderBy('coins', 'asc').get();
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new plan or update existing
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, coins, originalPrice, actualPrice, talktime, tag } = data;

    if (!coins || !actualPrice) {
      return NextResponse.json({ error: 'Coins and Actual Price are required' }, { status: 400 });
    }

    if (!adminDb) throw new Error('Firebase Admin not initialized');

    if (id) {
       // Update
       await adminDb.collection('GoldPlans').doc(id).update({
         coins: Number(coins),
         originalPrice: Number(originalPrice || 0),
         actualPrice: Number(actualPrice),
         talktime: talktime || '',
         tag: tag || '',
         updatedAt: new Date().toISOString()
       });
    } else {
       // Create
       await adminDb.collection('GoldPlans').add({
         coins: Number(coins),
         originalPrice: Number(originalPrice || 0),
         actualPrice: Number(actualPrice),
         talktime: talktime || '',
         tag: tag || '',
         createdAt: new Date().toISOString()
       });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE plan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    await adminDb.collection('GoldPlans').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
