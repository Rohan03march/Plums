import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/../lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // 1. Create user in Firebase Auth
    try {
      await adminAuth.createUser({
        email,
        password,
        displayName: 'Admin User',
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        // Just proceed to authorize in Firestore if they already exist in Auth
        console.log('User already exists in Auth, proceeding to authorize in Firestore.');
      } else {
        throw authError;
      }
    }

    // 2. Authorize in Firestore 'Admins' collection
    await adminDb.collection('Admins').doc(email.toLowerCase()).set({
      role: 'admin',
      createdAt: new Date().toISOString(),
      addedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
