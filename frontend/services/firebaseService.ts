import { firebaseDb } from '../config/firebase';
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, orderBy, QuerySnapshot, Timestamp, limit, DocumentSnapshot, arrayUnion, arrayRemove, startAfter, getDocs, query as firestoreQuery, documentId, increment, runTransaction } from 'firebase/firestore';

export const formatFirebaseDate = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  if (typeof timestamp === 'number') return new Date(timestamp).toLocaleString();
  if (timestamp.toDate) return timestamp.toDate().toLocaleString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return String(timestamp);
};
export interface User {
  id: string;
  name?: string;
  displayName?: string;
  username?: string;
  role: 'man' | 'woman';
  gender?: 'male' | 'female';
  coins: number;
  phone: string;
  createdAt: number;
  hobbies?: string[];
  besties?: string[];
  about?: string;
  avatar?: string;
  isOnline: boolean;
  isBlocked?: boolean;
  isAudioOnline?: boolean;
  isVideoOnline?: boolean;
  isProfileComplete?: boolean;
  paymentMethod?: 'upi' | 'card';
  // Stats for women
  allTimeEarnings?: number;
  videoEarnings?: number;
  audioEarnings?: number;
  giftEarnings?: number;
  totalCalls?: number;
  talkTime?: number;
  rating?: number;
  avgRating?: number;
  sumRatings?: number;
  totalRatings?: number;
  rupeeBalance?: number;
}

export const AVATAR_MAPPING: Record<string, any> = {
  'boy_1': require('../assets/images/3d_boy_1.jpg'),
  'boy_2': require('../assets/images/3d_boy_2.jpg'),
  'boy_3': require('../assets/images/3d_boy_3.jpg'),
  'boy_4': require('../assets/images/3d_boy_4.jpg'),
  'boy_5': require('../assets/images/3d_boy_5.jpg'),
  'boy_6': require('../assets/images/3d_boy_6.jpg'),
  'boy_7': require('../assets/images/3d_boy_7.jpg'),
  'girl_1': require('../assets/images/3d_avatar_1.jpg'),
  'girl_2': require('../assets/images/3d_avatar_2.jpg'),
  'girl_3': require('../assets/images/3d_avatar_3.jpg'),
  'girl_4': require('../assets/images/3d_avatar_4.jpg'),
  'girl_5': require('../assets/images/3d_avatar_5.jpg'),
  'girl_6': require('../assets/images/3d_avatar_6.jpg'),
  'girl_7': require('../assets/images/3d_avatar_7.jpg'),
};

export const getAvatarSource = (avatarId: string | undefined, defaultType: 'man' | 'woman') => {
  if (avatarId && AVATAR_MAPPING[avatarId]) {
    return AVATAR_MAPPING[avatarId];
  }
  // Try to see if it's already a URI (legacy)
  // We only allow http URLs for cross-device persistence. 
  // Local 'file://' URIs are ignored to trigger the fallback.
  if (avatarId?.startsWith('http')) {
    return { uri: avatarId };
  }
  // Default fallbacks
  return defaultType === 'man' 
    ? require('../assets/images/3d_boy_1.jpg') 
    : require('../assets/images/3d_avatar_1.jpg');
};

export interface Transaction {
  id?: string;
  userId: string;
  amountInRupees: number;
  coins: number;
  type: 'deposit' | 'withdrawal' | 'call_spend' | 'call_earn' | 'refund' | 'gift_spend' | 'gift_earn' | 'bestie_spend';
  status: 'pending' | 'success' | 'failed';
  timestamp: any;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  planId?: string;
  details?: string;
}

export interface CallRecord {
  id: string;
  callerId: string;
  callerName?: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  duration: string; // e.g. "12m 30s"
  durationInMinutes: number; // e.g. 13
  cost: number;
  timestamp: any; // Firestore timestamp
  type: 'audio' | 'video';
}

export interface Pod {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  pricePerMinute: number;
  participants: number;
  isActive: boolean;
  tags?: string[];
  type: 'audio' | 'video';
  createdAt: number;
}

export interface GoldPlan {
  id: string;
  coins: number;
  originalPrice: number;
  actualPrice: number;
  talktime?: string;
  isPopular?: boolean;
  tag?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  type: 'audio' | 'video';
  channelId: string;
  timestamp: any;
  meta?: any;
}

export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = doc(firebaseDb, 'Users', userId);
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const subscribeToUser = (userId: string, callback: (data: User | null) => void) => {
  const userDoc = doc(firebaseDb, 'Users', userId);
  return onSnapshot(userDoc, (snapshot: DocumentSnapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as User);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Firestore Subscribe Error:", error);
    callback(null);
  });
};

export const updateUserPresence = async (uid: string, data: Partial<User>) => {
  try {
    const userDoc = doc(firebaseDb, 'Users', uid);
    await updateDoc(userDoc, data);
  } catch (error) {
    console.error("Error updating presence:", error);
  }
};

export const subscribeToActivePods = (callback: (pods: Pod[]) => void) => {
  const podsQuery = query(collection(firebaseDb, 'Pods'), where('isActive', '==', true));
  return onSnapshot(podsQuery, (snapshot: QuerySnapshot) => {
    const pods = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Pod));
    callback(pods);
  }, (error) => {
    console.error("Firestore Active Pods Error:", error);
    callback([]);
  });
};

export const subscribeToFemaleCreators = (callback: (users: User[]) => void, limitCount: number = 20) => {
  const q = query(
    collection(firebaseDb, 'Users'), 
    where('role', '==', 'woman'),
    where('isProfileComplete', '==', true),
    where('isOnline', '==', true),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    callback(list);
  }, (error) => {
    console.error("Error fetching female creators:", error);
    callback([]);
  });
};

export const subscribeToBestieCreators = (bestieIds: string[], callback: (users: User[]) => void) => {
  if (!bestieIds || bestieIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore 'where in' is limited to 30 elements
  const q = query(
    collection(firebaseDb, 'Users'),
    where('role', '==', 'woman'),
    where(documentId(), 'in', bestieIds.slice(0, 30))
  );

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    callback(list);
  }, (error) => {
    console.error("Error fetching bestie creators:", error);
    callback([]);
  });
};

export const fetchMoreFemaleCreators = async (lastVisibleDoc: any, limitCount: number = 20) => {
  try {
    let q;
    if (lastVisibleDoc) {
      q = query(
        collection(firebaseDb, 'Users'),
        where('role', '==', 'woman'),
        where('isProfileComplete', '==', true),
        where('isOnline', '==', true),
        startAfter(lastVisibleDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(firebaseDb, 'Users'),
        where('role', '==', 'woman'),
        where('isProfileComplete', '==', true),
        where('isOnline', '==', true),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    return {
      list,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.error("Error fetching more female creators:", error);
    return { list: [], lastVisible: null };
  }
};

export const toggleFavorite = async (uid: string, creatorId: string, isFavorite: boolean) => {
  try {
    const userRef = doc(firebaseDb, 'Users', uid);
    await setDoc(userRef, {
      besties: isFavorite ? arrayUnion(creatorId) : arrayRemove(creatorId)
    }, { merge: true });
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  try {
    const userRef = doc(firebaseDb, 'Users', uid);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const subscribeToTransactions = (userId: string, callback: (txs: Transaction[]) => void, limitCount: number = 20) => {
  if (!userId) {
    console.warn("subscribeToTransactions: userId is undefined or null");
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, 'Transactions'), 
    where('userId', '==', userId), 
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(list);
  }, (error) => {
    console.error("Error fetching transactions:", error);
    callback([]);
  });
};

export const fetchMoreTransactions = async (userId: string, lastVisibleDoc: any, limitCount: number = 20, types?: string[]) => {
  try {
    let constraints: any[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ];

    if (types && types.length > 0) {
      constraints.push(where('type', 'in', types));
    }

    if (lastVisibleDoc) {
      constraints.push(startAfter(lastVisibleDoc));
    }

    const q = query(collection(firebaseDb, 'Transactions'), ...constraints);
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    return {
      list,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error("Error fetching more transactions:", error);
    return { list: [], lastVisible: null };
  }
};

export const subscribeToGoldPlans = (callback: (plans: GoldPlan[]) => void) => {
  const q = query(collection(firebaseDb, 'GoldPlans'), orderBy('coins', 'asc'));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoldPlan));
    callback(list);
  }, (error) => {
    console.error("Error fetching gold plans:", error);
    callback([]);
  });
};

export const subscribeToCallHistory = (userId: string, callback: (calls: CallRecord[]) => void, limitCount: number = 20) => {
  if (!userId) {
    console.warn("subscribeToCallHistory: userId is undefined or null");
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, 'CallHistory'), 
    where('callerId', '==', userId), 
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord));
    callback(list);
  }, (error) => {
    console.error("Error fetching call history:", error);
    callback([]);
  });
};

export const subscribeToCreatorCallHistory = (userId: string, callback: (calls: CallRecord[]) => void, limitCount: number = 20) => {
  if (!userId) {
    console.warn("subscribeToCreatorCallHistory: userId is undefined or null");
    callback([]);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, 'CallHistory'), 
    where('receiverId', '==', userId), 
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord));
    callback(list);
  }, (error) => {
    console.error("Error fetching creator call history:", error);
    callback([]);
  });
};

export const fetchMoreCallHistory = async (userId: string, lastVisibleDoc: any, limitCount: number = 20) => {
  try {
    let q;
    if (lastVisibleDoc) {
      q = query(
        collection(firebaseDb, 'CallHistory'),
        where('callerId', '==', userId),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(firebaseDb, 'CallHistory'),
        where('callerId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord));
    return {
      list,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error("Error fetching more call history:", error);
    return { list: [], lastVisible: null };
  }
};

export const fetchMoreCreatorCallHistory = async (userId: string, lastVisibleDoc: any, limitCount: number = 20) => {
  try {
    let q;
    if (lastVisibleDoc) {
      q = query(
        collection(firebaseDb, 'CallHistory'),
        where('receiverId', '==', userId),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(firebaseDb, 'CallHistory'),
        where('receiverId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord));
    return {
      list,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error("Error fetching more creator call history:", error);
    return { list: [], lastVisible: null };
  }
};

export const recordTransaction = async (tx: Transaction) => {
  try {
    await addDoc(collection(firebaseDb, 'Transactions'), tx);
  } catch (error) {
    console.error("Error recording transaction:", error);
  }
};

export const recordCallRecord = async (record: Omit<CallRecord, 'id'>) => {
  try {
    const timestamp = Timestamp.now();
    await addDoc(collection(firebaseDb, 'CallHistory'), {
      ...record,
      timestamp
    });
    
    // Increment totalCalls for both users
    const callerRef = doc(firebaseDb, 'Users', record.callerId);
    const receiverRef = doc(firebaseDb, 'Users', record.receiverId);
    
    await Promise.all([
      updateDoc(callerRef, { 
        totalCalls: increment(1),
        talkTime: increment(record.durationInMinutes)
      }),
      updateDoc(receiverRef, { 
        totalCalls: increment(1),
        talkTime: increment(record.durationInMinutes)
      }),
      // Record Consolidated Transactions
      addDoc(collection(firebaseDb, 'Transactions'), {
        userId: record.callerId,
        coins: record.cost,
        amountInRupees: record.cost / 10,
        type: 'call_spend',
        status: 'success',
        timestamp,
        details: `${record.type.toUpperCase()} Call Payment (${record.duration})`
      }),
      addDoc(collection(firebaseDb, 'Transactions'), {
        userId: record.receiverId,
        coins: record.cost,
        amountInRupees: record.type === 'audio' ? (record.cost * 0.14) : (record.cost * 0.10),
        type: 'call_earn',
        status: 'success',
        timestamp,
        details: `${record.type.toUpperCase()} Call Earning (${record.duration})`
      })
    ]);

    console.log("Successfully recorded call history and updated stats");
  } catch (error) {
    console.error("Error recording call history:", error);
  }
};

export const updateUserBalance = async (userId: string, newBalance: number) => {
  try {
    const userDoc = doc(firebaseDb, 'Users', userId);
    await updateDoc(userDoc, { coins: newBalance });
  } catch (error) {
    console.error("Error updating balance:", error);
  }
};

export const initiateCallSession = async (session: Omit<CallSession, 'id'>) => {
  try {
    const callRef = collection(firebaseDb, 'Calls');
    const docRef = await addDoc(callRef, session);
    return docRef.id;
  } catch (error) {
    console.error("Error initiating call session:", error);
    return null;
  }
};

export const subscribeToIncomingCalls = (userId: string, callback: (call: CallSession | null) => void) => {
  if (!userId) {
    console.warn("subscribeToIncomingCalls: userId is undefined or null");
    callback(null);
    return () => {};
  }
  const q = query(
    collection(firebaseDb, 'Calls'),
    where('receiverId', '==', userId),
    where('status', '==', 'ringing'),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      callback({ id: doc.id, ...doc.data() } as CallSession);
    } else {
      callback(null);
    }
  });
};

export const updateCallSession = async (sessionId: string, status: CallSession['status']) => {
  try {
    const callDoc = doc(firebaseDb, 'Calls', sessionId);
    await updateDoc(callDoc, { status });
  } catch (error) {
    console.error("Error updating call session:", error);
  }
};

export const subscribeToCallSession = (sessionId: string, callback: (session: CallSession | null) => void) => {
  const callDoc = doc(firebaseDb, 'Calls', sessionId);
  return onSnapshot(callDoc, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as CallSession);
    } else {
      callback(null);
    }
  });
};

export const executeCallTransfer = async (
  callerId: string, 
  receiverId: string, 
  amount: number, 
  type: 'audio' | 'video'
) => {
  try {
    const callerRef = doc(firebaseDb, 'Users', callerId);
    const receiverRef = doc(firebaseDb, 'Users', receiverId);
    
    await runTransaction(firebaseDb, async (transaction) => {
      const callerSnap = await transaction.get(callerRef);
      if (!callerSnap.exists()) throw "Caller does not exist";
      
      const currentCoins = callerSnap.data().coins || 0;
      if (currentCoins < amount) throw "Insufficient balance";

      // 1. Update Caller
      transaction.update(callerRef, { coins: increment(-amount) });

      // 2. Update Receiver
      const inrEarned = type === 'audio' ? (amount * 0.14) : (amount * 0.10);
      const receiverUpdates: any = {
        coins: increment(amount),
        allTimeEarnings: increment(amount),
        rupeeBalance: increment(inrEarned)
      };

      if (type === 'audio') {
        receiverUpdates.audioEarnings = increment(amount);
      } else {
        receiverUpdates.videoEarnings = increment(amount);
      }

      transaction.update(receiverRef, receiverUpdates);
    });

    return true;
  } catch (error) {
    console.error("Error executing call transfer:", error);
    return false;
  }
};

export const blockUser = async (blockerId: string, blockedId: string) => {
  try {
    const blockerRef = doc(firebaseDb, 'Users', blockerId);
    await updateDoc(blockerRef, {
      blockedUsers: arrayUnion(blockedId)
    });
    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    return false;
  }
};

export const sendGift = async (senderId: string, receiverId: string, coins: number, type: Transaction['type'] = 'gift_spend', details: string = 'Gifting') => {
  try {
    const senderRef = doc(firebaseDb, 'Users', senderId);
    const receiverRef = doc(firebaseDb, 'Users', receiverId);
    
    const timestamp = Timestamp.now();

    await runTransaction(firebaseDb, async (transaction) => {
      const senderSnap = await transaction.get(senderRef);
      if (!senderSnap.exists()) throw "Sender does not exist";
      
      const senderCoins = senderSnap.data().coins || 0;
      if (senderCoins < coins) throw "Insufficient balance";

      // 1. Update Balances
      transaction.update(senderRef, { coins: increment(-coins) });
      transaction.update(receiverRef, { 
        coins: increment(coins),
        allTimeEarnings: increment(coins),
        giftEarnings: increment(coins),
        rupeeBalance: increment(coins * 0.10)
      });

      // 2. Record Transactions (using transaction.set/add if possible, but Firestore transactions usually require knowing the ID or using non-transactional addDoc for logs)
      // Since recordTransaction uses addDoc, we'll keep it outside for simplicity unless we want total atomicity including the log
      // However, the balance updates are now atomic.
    });

    // Recording logs after successful transaction
    await Promise.all([
      recordTransaction({
        userId: senderId,
        coins,
        amountInRupees: coins / 10,
        type: type,
        status: 'success',
        timestamp,
        details: details
      }),
      recordTransaction({
        userId: receiverId,
        coins,
        amountInRupees: coins / 10,
        type: 'gift_earn',
        status: 'success',
        timestamp,
        details: 'Gifting'
      })
    ]);
    return true;
  } catch (error) {
    console.error("Error sending gift:", error);
    return false;
  }
};

export const updateCreatorRating = async (creatorId: string, rating: number) => {
  try {
    const creatorRef = doc(firebaseDb, 'Users', creatorId);
    await updateDoc(creatorRef, {
      sumRatings: increment(rating),
      totalRatings: increment(1)
    });
    
    // Calculate new average
    const creatorSnap = await getDoc(creatorRef);
    if (creatorSnap.exists()) {
      const data = creatorSnap.data();
      const newAverage = (data.sumRatings || 0) / (data.totalRatings || 1);
      await updateDoc(creatorRef, { rating: Number(newAverage.toFixed(1)) });
    }
    return true;
  } catch (error) {
    console.error("Error updating creator rating:", error);
    return false;
  }
};

export const updateCallSessionMeta = async (sessionId: string, meta: any) => {
  try {
    const sessionRef = doc(firebaseDb, 'Calls', sessionId);
    await updateDoc(sessionRef, { meta });
    return true;
  } catch (error) {
    console.error("Error updating session meta:", error);
    return false;
  }
};
