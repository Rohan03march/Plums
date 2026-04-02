import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { blockUser, sendGift, toggleFavorite, updateCallSessionMeta, getAvatarSource, updateCallSession } from '../../services/firebaseService';
import { Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { AudioCallView } from '../../components/call/AudioCallView';
import { VideoCallView } from '../../components/call/VideoCallView';

const { width } = Dimensions.get('window');

// Components shared by both views
const HeartPop = React.memo(({ x, y, onComplete }: { x: number, y: number, onComplete: () => void }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(onComplete);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      opacity: anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: x },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
        { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 1] }) },
        { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '25deg'] }) }
      ]
    }}>
      <Ionicons name="heart" size={24} color="#FF4D67" />
    </Animated.View>
  );
});

const CoinJump = React.memo(({ onComplete }: { onComplete: () => void }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(onComplete);
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [100, -80, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.8, 1.2] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX }, { translateY }, { scale }, { rotate }], opacity, zIndex: 5000 }}>
       <FontAwesome5 name="coins" size={28} color="#FFD700" style={{ shadowColor: '#FFD700', shadowRadius: 10, shadowOpacity: 0.8 }} />
    </Animated.View>
  );
});

// A dedicated component to handle particles without re-rendering the whole CallRoom
const ParticleBackground = ({ heartPops, coinJumps, onHeartComplete, onCoinComplete }: any) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {heartPops.map((h: any) => (
        <HeartPop key={h.id} x={h.x} y={h.y} onComplete={() => onHeartComplete(h.id)} />
      ))}
      <View style={{ position: 'absolute', bottom: 100, alignSelf: 'center' }}>
        {coinJumps.map((j: any) => (
          <CoinJump key={j.id} onComplete={() => onCoinComplete(j.id)} />
        ))}
      </View>
    </View>
  );
};

export default function CallRoom() {
  const { id, role: roleRaw, type: typeRaw } = useLocalSearchParams();
  const role = roleRaw as 'caller' | 'receiver';
  const type = typeRaw as 'audio' | 'video';
  const { colors, isDark } = useTheme();
  const { appUser } = useAuth();
  const {
    activeCall: session,
    seconds,
    remoteUid,
    isMuted,
    isSpeaker,
    isCameraOn,
    showRatingModal,
    userRating,
    startCall,
    endCall,
    minimizeCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    setUserRating,
    submitRating: submitRatingFromContext,
    skipRating,
    isEngineReady,
    lastSignal,
    sendCallSignal,
    isSubmittingRating
  } = useCall();

  const [isLocalVideoMain, setIsLocalVideoMain] = useState(false);
  const [participant, setParticipant] = useState<{name: string, avatar: string | null, gender: 'woman' | 'man'} | null>(null);
  const [loading, setLoading] = useState(!session);
  const [isBestie, setIsBestie] = useState(false);
  const [giftNotification, setGiftNotification] = useState<string | null>(null);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [heartPops, setHeartPops] = useState<{ id: number, x: number, y: number }[]>([]);
  const [coinJumps, setCoinJumps] = useState<{ id: number }[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const heartCounter = useRef(0);
  const lastProcessedSignalTime = useRef(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (session && !participant) {
      setParticipant({
        name: (role === 'caller' ? session.receiverName : session.callerName) || 'User',
        avatar: (role === 'caller' ? session.receiverAvatar : session.callerAvatar) || null,
        gender: role === 'caller' ? 'woman' : 'man'
      });
    }
  }, [session, role, participant]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (!hasInitialized.current && id) {
      hasInitialized.current = true;
      
      // Failsafe for instant-navigation: ensure session is marked 'accepted'
      if (role === 'receiver' && session?.status === 'ringing') {
        updateCallSession(id as string, 'accepted');
      }

      startCall(id as string, role as 'caller' | 'receiver', type as 'audio' | 'video')
        .then(() => setLoading(false));
    } else if (session) {
      setLoading(false);
    }
  }, [id, session, startCall, role, type]);

  useEffect(() => {
    if (appUser && session) {
      const creatorId = role === 'caller' ? session.receiverId : session.callerId;
      const isActuallyBestie = Array.isArray(appUser.besties) && appUser.besties.includes(creatorId);
      console.log(`[Call Room] Bestie Check: CreatorId=${creatorId}, isBestie=${isActuallyBestie}, User=${appUser.id}`);
      setIsBestie(isActuallyBestie);
    }
  }, [appUser?.besties, session, role]);

  // Handle incoming Agora signals (signaling optimization)
  useEffect(() => {
    if (lastSignal && lastSignal.timestamp > lastProcessedSignalTime.current) {
      lastProcessedSignalTime.current = lastSignal.timestamp;
      
      if (lastSignal.type === 'gift') {
        if (role === 'receiver') {
          setGiftNotification(`Received ${lastSignal.data.amount} Gold! ✨`);
          setTimeout(() => setGiftNotification(null), 5000);
          setCoinJumps(prev => [...prev, { id: ++heartCounter.current }]);
        }
      } else if (lastSignal.type === 'heart') {
        const id = ++heartCounter.current;
        setHeartPops(prev => [...prev, { id, x: Math.random() * 200 - 100, y: Math.random() * -200 - 50 }]);
        setTimeout(() => setHeartPops(prev => prev.filter(h => h.id !== id)), 1500);
      }
    }
  }, [lastSignal, role]);

  const handleBlock = async () => {
    if (!session || !appUser) return;
    const targetId = role === 'caller' ? session.receiverId : session.callerId;
    Alert.alert("Block User", "End call and block this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
          await blockUser(appUser.id, targetId);
          await endCall();
        }
      }
    ]);
  };

  const handleToggleBestie = async () => {
    if (!session || !appUser || role !== 'caller') return;
    const creatorId = session.receiverId;
    if (!isBestie) {
      if ((appUser.coins || 0) < 10) {
        Alert.alert("Insufficient Gold", "Adding a Bestie costs 10 gold.");
        return;
      }
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const id = ++heartCounter.current;
          setHeartPops(prev => [...prev, { id, x: Math.random() * 200 - 100, y: Math.random() * -200 - 50 }]);
          setTimeout(() => setHeartPops(prev => prev.filter(h => h.id !== id)), 1500);
        }, i * 150);
      }
      Alert.alert("Add Bestie", "Add to Besties for 10 gold?", [
        { text: "Cancel", style: "cancel" },
        { text: "Add (10 Gold)", onPress: async () => {
            const receiverName = role === 'caller' ? session?.receiverName : session?.callerName;
            const success = await sendGift(appUser.id, creatorId, 10, 'bestie_spend', `Added ${receiverName} as Bestie`);
            if (success) {
              await toggleFavorite(appUser.id, creatorId, true);
              setIsBestie(true);
            }
          }
        }
      ]);
    } else {
      await toggleFavorite(appUser.id, creatorId, false);
      setIsBestie(false);
    }
  };

  const handleSendGift = async (amount: number) => {
    if (!session || !appUser || role !== 'caller') return;
    if ((appUser.coins || 0) < amount) {
      Alert.alert("Insufficient Gold", "You don't have enough gold.");
      return;
    }
    setCoinJumps(prev => [...prev, { id: ++heartCounter.current }]);
    setShowGiftMenu(false);
    
    // 1. Send Signaling Notification (Optimized - Instant and Zero DB cost)
    sendCallSignal('gift', { amount });

    // 2. Persist Database Transaction (Security - Non-optional)
    await sendGift(appUser.id, session.receiverId, amount);
  };

  const handleSendHeart = () => {
    // Highly optimized signaling - Peer to Peer via Agora
    const id = ++heartCounter.current;
    setHeartPops(prev => [...prev, { id, x: Math.random() * 200 - 100, y: Math.random() * -200 - 50 }]);
    setTimeout(() => setHeartPops(prev => prev.filter(h => h.id !== id)), 1500);
    
    sendCallSignal('heart', {});
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const commonProps = {
    session, participant, role, remoteUid, seconds, isMuted, toggleMute, endCall, minimizeCall, handleBlock,
    formatTime, colors, isDark, pulseAnim, isBestie, handleToggleBestie, toggleGiftMenu: () => setShowGiftMenu(!showGiftMenu),
    giftNotification, handleSendHeart
  };

  // Premium Ringing View for Callers
  const RingingView = () => {
    const { creatorName: paramName, creatorAvatar: paramAvatar } = useLocalSearchParams();
    const displayAvatar = (paramAvatar as string) || participant?.avatar;
    const displayName = (paramName as string) || participant?.name || 'Creator';

    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={isDark ? ['#1A0B2E', '#0F041A'] : ['#FFF5F7', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.ringingContent}>
          <Animated.View style={[
            styles.avatarPulseWrapper,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Image
              source={getAvatarSource(displayAvatar ?? undefined, 'woman')}
              style={styles.ringingAvatar}
              contentFit="cover"
            />
          </Animated.View>
          
          <Text style={[styles.ringingName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.ringingStatus, { color: colors.primary }]}>Ringing...</Text>
          
          <View style={styles.ringingActions}>
            <TouchableOpacity 
              style={[styles.endCallBtn, { backgroundColor: '#FF3B30' }]} 
              onPress={endCall}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.endCallLabel, { color: colors.subText }]}>Cancel</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render a premium Ringing view for callers, or a simple loader for receivers
  if ((loading || !session || !remoteUid) && role === 'caller') {
    return <RingingView />;
  }

  // Simple skeletal loader for receiver (they only see this for a split second after clicking Answer)
  if (loading || !session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={isDark ? ['#1A0B2E', '#0F041A'] : ['#FFF5F7', '#FFFFFF']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#FF4D67" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" translucent />
      {type === 'video' ? (
        <VideoCallView 
          {...commonProps}
          isCameraOn={isCameraOn}
          isEngineReady={isEngineReady}
          isLocalVideoMain={isLocalVideoMain}
          toggleCamera={toggleCamera}
          toggleVideoSwap={() => setIsLocalVideoMain(!isLocalVideoMain)}
        />
      ) : (
        <AudioCallView 
          {...commonProps}
          isSpeaker={isSpeaker}
          toggleSpeaker={toggleSpeaker}
        />
      )}

      <ParticleBackground 
        heartPops={heartPops}
        coinJumps={coinJumps}
        onHeartComplete={(id: number) => setHeartPops(prev => prev.filter(h => h.id !== id))}
        onCoinComplete={(id: number) => setCoinJumps(prev => prev.filter(j => j.id !== id))}
      />

      {/* Shared Modals */}
      <Modal transparent visible={showGiftMenu} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGiftMenu(false)}>
          <View style={styles.bottomSheetContainer}>
            <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={styles.bottomSheet}>
              <View style={styles.sheetGrabber} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Send a Gift</Text>
              <View style={styles.tokenGrid}>
                {[20, 50, 100, 500].map(amount => (
                  <TouchableOpacity key={amount} style={styles.gridTokenWrapper} onPress={() => handleSendGift(amount)}>
                    <LinearGradient colors={['#FFFACD', '#FFD700', '#DAA520']} style={styles.gridTokenCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <View style={styles.gridTokenInner}>
                        <FontAwesome5 name="coins" size={18} color="#4A2F00" />
                        <Text style={styles.gridTokenText}>{amount}</Text>
                      </View>
                    </LinearGradient>
                    <Text style={[styles.tokenLabel, { color: colors.subText }]}>Gold</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ringingContent: {
    alignItems: 'center',
    gap: 30,
    zIndex: 10,
  },
  avatarPulseWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },
  ringingAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#fff',
  },
  ringingName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ringingStatus: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ringingActions: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  endCallLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderAvatarLarge: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#FF4D67', marginBottom: 20 },
  userName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 8 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  bottomSheetContainer: { width: '100%', position: 'absolute', bottom: 0 },
  bottomSheet: { paddingTop: 12, paddingBottom: 40, paddingHorizontal: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  sheetGrabber: { width: 40, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 25, textAlign: 'center' },
  tokenGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  gridTokenWrapper: { width: '47%', alignItems: 'center', gap: 8 },
  gridTokenCircle: { width: '100%', height: 80, borderRadius: 20, overflow: 'hidden' },
  gridTokenInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  gridTokenText: { color: '#4A2F00', fontSize: 22, fontWeight: '900' },
  tokenLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 14, fontWeight: '600' },
});
