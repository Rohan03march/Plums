import * as admin from 'firebase-admin';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

// Check if we have the minimum required config
const isConfigured = !!(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

if (isConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as any),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export as null if not initialized, so consumers can handle gracefully
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
