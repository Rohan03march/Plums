import { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, Platform } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { blockUser, sendGift, toggleFavorite, updateCallSessionMeta, getAvatarSource } from '../../services/firebaseService';
import { Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { AudioCallView } from '../../components/call/AudioCallView';
import { VideoCallView } from '../../components/call/VideoCallView';

const { width } = Dimensions.get('window');

// Components shared by both views
const HeartPop = ({ x, y, onComplete }: { x: number, y: number, onComplete: () => void }) => {
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
};

const CoinJump = ({ onComplete }: { onComplete: () => void }) => {
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
  const lastProcessedGiftTime = useRef(0);
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
      startCall(id as string, role as 'caller' | 'receiver', type as 'audio' | 'video')
        .then(() => setLoading(false));
    } else if (session) {
      setLoading(false);
    }
  }, [id, session, startCall, role, type]);

  useEffect(() => {
    if (appUser && session) {
      const creatorId = role === 'caller' ? session.receiverId : session.callerId;
      setIsBestie(appUser.besties?.includes(creatorId) || false);
    }
    if (session?.meta?.lastGift) {
      const gift = session.meta.lastGift;
      if (gift.timestamp > lastProcessedGiftTime.current) {
        lastProcessedGiftTime.current = gift.timestamp;
        if (role === 'receiver') {
          setGiftNotification(`Received ${gift.amount} Gold! ✨`);
          setTimeout(() => setGiftNotification(null), 5000);
          setCoinJumps(prev => [...prev, { id: ++heartCounter.current }]);
        }
      }
    }
  }, [appUser?.besties, session?.meta?.lastGift, role]);

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
    const success = await sendGift(appUser.id, session.receiverId, amount);
    if (success) {
      const now = Date.now();
      lastProcessedGiftTime.current = now;
      await updateCallSessionMeta(id as string, { lastGift: { amount, timestamp: now } });
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const commonProps = {
    session, participant, role, remoteUid, seconds, isMuted, toggleMute, endCall, minimizeCall, handleBlock,
    formatTime, colors, isDark, pulseAnim, isBestie, handleToggleBestie, toggleGiftMenu: () => setShowGiftMenu(!showGiftMenu),
    coinJumps, heartPops, handleJumpComplete: (id: number) => setCoinJumps(prev => prev.filter(j => j.id !== id)),
    setHeartPops, giftNotification, CoinJump, HeartPop
  };

  // Render only a skeletal loader if the session is not yet loaded
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

      <Modal transparent visible={showRatingModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
            <Image source={getAvatarSource(participant?.avatar || undefined, participant?.gender || (role === 'caller' ? 'woman' : 'man'))} style={[styles.placeholderAvatarLarge, { width: 100, height: 100, borderRadius: 50, marginBottom: 15 }]} />
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Rate Your Call</Text>
            <Text style={[styles.ratingSub, { color: colors.subText }]}>How was your conversation with {participant?.name}?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Ionicons name={userRating >= star ? "star" : "star-outline"} size={40} color={userRating >= star ? "#FFD700" : colors.subText} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.submitRatingBtn, { opacity: userRating === 0 ? 0.5 : 1 }]} onPress={submitRatingFromContext} disabled={userRating === 0}>
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={skipRating}><Text style={[styles.skipText, { color: colors.subText }]}>Skip</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  ratingCard: { width: width * 0.85, padding: 30, borderRadius: 32, alignItems: 'center' },
  ratingTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  ratingSub: { fontSize: 16, textAlign: 'center', marginBottom: 25 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  submitRatingBtn: { backgroundColor: '#FF4D67', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 24, width: '100%', alignItems: 'center', marginBottom: 15 },
  submitRatingText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 14, fontWeight: '600' },
});
