'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check if user is in Admins collection
        try {
          const email = (user.email || '').toLowerCase();
          console.log(`Checking admin status for: ${email}`);
          
          const adminDoc = await getDoc(doc(db, 'Admins', email));
          
          if (adminDoc.exists()) {
            console.log('Admin verified successfully');
            setIsAdmin(true);
          } else {
            console.error(`ACCESS DENIED: ${email} is not in 'Admins' collection.`);
            console.info("To fix this, create a document in Firestore collection 'Admins' with ID as your email.");
            setIsAdmin(false);
            await firebaseSignOut(auth);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login' && pathname !== '/privacy-policy') {
        router.push('/login');
      } else if (user && isAdmin && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isAdmin, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
