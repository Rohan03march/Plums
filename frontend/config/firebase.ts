import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore - getReactNativePersistence is available in the React Native Firebase SDK
import { initializeAuth, getReactNativePersistence, signInAnonymously } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);
export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const ensureFirebaseAuth = async () => {
  if (!firebaseAuth.currentUser) {
    try {
      const cred = await signInAnonymously(firebaseAuth);
      console.log("Firebase Anonymous Auth Success. UID:", cred.user.uid);
    } catch (e) {
      console.error("Firebase Anonymous Auth Error", e);
    }
  } else {
    console.log("Firebase Auth already active. UID:", firebaseAuth.currentUser.uid);
  }
};
