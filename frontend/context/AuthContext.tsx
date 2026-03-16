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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ uid: string; phoneNumber?: string | null; isAnonymous?: boolean } | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDb: (() => void) | null = null;
    let isMounted = true;

    const loadPersistedUser = async () => {
      try {
        const storedMockId = await AsyncStorage.getItem('mock_user_id');
        if (storedMockId && isMounted) {
          console.log('Restoring persisted mock user:', storedMockId);
          setUser({ uid: storedMockId });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error loading persisted mock user:', e);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      // If we already have a mock user (set by AsyncStorage or setMockUser), don't override with null
      const storedMockId = await AsyncStorage.getItem('mock_user_id');
      if (storedMockId) return;

      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setAppUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    loadPersistedUser();

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
    await AsyncStorage.removeItem('mock_user_id');
    await firebaseAuth.signOut();
    setUser(null);
    setAppUser(null);
  };

  const setMockUser = async (uid: string) => {
    await AsyncStorage.setItem('mock_user_id', uid);
    setUser({ uid });
    setLoading(true); // Restart loading state to fetch new user data
  };

  const signInAnonymously = async () => {
    try {
      await AsyncStorage.removeItem('mock_user_id');
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

