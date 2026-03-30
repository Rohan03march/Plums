import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, subscribeToUser } from '../services/firebaseService';
import { firebaseAuth } from '../config/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface AuthContextType {
  user: { uid: string; phoneNumber?: string | null; isAnonymous?: boolean } | null;
  appUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  setMockUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
  signInAnonymously: async () => {},
  setMockUser: async () => {},
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<{ uid: string; phoneNumber?: string | null; isAnonymous?: boolean } | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setAppUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubDb: (() => void) | null = null;
    
    if (user?.uid) {
      unsubDb = subscribeToUser(user.uid, (data) => {
        if (data?.isBlocked) {
          Alert.alert("Account Suspended", "Your account has been blocked by administrators.");
          signOut();
          return;
        }
        setAppUser(data);
        setLoading(false);
      });
    }

    return () => {
      if (unsubDb) unsubDb();
    };
  }, [user?.uid]);

  const signOut = async () => {
    await firebaseAuth.signOut();
    setUser(null);
    setAppUser(null);
  };

  const setMockUser = async (uid: string) => {
    console.warn("setMockUser called in production-ready mode. This should be replaced by real auth.");
    setUser({ uid });
    setLoading(true);
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(firebaseAuth);
    } catch (error) {
      console.error("Anonymous Sign-in Error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut, signInAnonymously, setMockUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

