import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { updateCallSession, getAvatarSource, blockUser, sendGift, toggleFavorite, updateCallSessionMeta } from '../../services/firebaseService';
import { Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  RtcSurfaceView,
  UserOfflineReasonType,
} from '../../services/agoraService';

const { width } = Dimensions.get('window');
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

export default function CallRoom() {
  const router = useRouter();
  const { id, role, type } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { appUser } = useAuth();
  const {
    activeCall: session,
    seconds,
    remoteUid,
    isMuted,
    isSpeaker,
    showRatingModal,
    userRating,
    engine,
    startCall,
    endCall,
    minimizeCall,
    toggleMute,
    toggleSpeaker,
    setUserRating,
    submitRating: submitRatingFromContext,
    skipRating
  } = useCall();

  const [loading, setLoading] = useState(!session);
  const [isBestie, setIsBestie] = useState(false);
  const [giftNotification, setGiftNotification] = useState<string | null>(null);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [heartPops, setHeartPops] = useState<{ id: number, x: number, y: number }[]>([]);
  const [coinJumps, setCoinJumps] = useState<{ id: number }[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const coinAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const heartCounter = useRef(0);
  const lastProcessedGiftTime = useRef(0);
  // Animations for avatar and side tokens
  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    
    // Mesh Background & Floating Animations
    const meshAnims = Array(4).fill(0).map(() => new Animated.Value(0));
    meshAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 4000 + i * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 4000 + i * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });

    // Floating animation for tokens
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 10, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    pulse.start();
    float.start();
    return () => {
      pulse.stop();
      float.stop();
    };
  }, [pulseAnim, floatAnim]);

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

  // Jump from left badge (relative to center 0,0) to center (0,0)
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


  // Initialize Call if not already active
  useEffect(() => {
    if (!session && id) {
      startCall(id as string, role as 'caller' | 'receiver', type as 'audio' | 'video')
        .then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, session]);

  // Bestie & Gift Notifications
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
          
          // Trigger Animation for receiver
          const jumpId = ++heartCounter.current;
          setCoinJumps(prev => [...prev, { id: jumpId }]);
        }
      }
    }
  }, [appUser?.besties, session?.meta?.lastGift, role]);
  const handleBlock = async () => {
    if (!session || !appUser) return;
    const targetId = role === 'caller' ? session.receiverId : session.callerId;
    Alert.alert("Block User", "End call and block this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block", style: "destructive", onPress: async () => {
          await blockUser(appUser.id, targetId);
          await endCall();
        }
      }
    ]);
  };

  const toggleGiftMenu = () => {
    setShowGiftMenu(!showGiftMenu);
  };

  const handleToggleBestie = async () => {
    if (!session || !appUser || role !== 'caller') return;
    const creatorId = session.receiverId;
    if (!isBestie) {
      if ((appUser.coins || 0) < 10) {
        Alert.alert("Insufficient Gold", "Adding a Bestie costs 10 gold.");
        return;
      }
      
      // Trigger hearts
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const id = ++heartCounter.current;
          setHeartPops(prev => [...prev, { id, x: Math.random() * 200 - 100, y: Math.random() * -200 - 50 }]);
          setTimeout(() => setHeartPops(prev => prev.filter(h => h.id !== id)), 1500);
        }, i * 150);
      }

      Alert.alert("Add Bestie", "Add to Besties for 10 gold?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add (10 Gold)", onPress: async () => {
            const success = await sendGift(appUser.id, creatorId, 10);
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

    // Trigger Animation
    const jumpId = ++heartCounter.current;
    setCoinJumps(prev => [...prev, { id: jumpId }]);
    setShowGiftMenu(false);

    const success = await sendGift(appUser.id, session.receiverId, amount);
    if (success) {
      const now = Date.now();
      lastProcessedGiftTime.current = now;
      await updateCallSessionMeta(id as string, { lastGift: { amount, timestamp: now } });
    }
  };

  const handleJumpComplete = (id: number) => {
    setCoinJumps(prev => prev.filter(j => j.id !== id));
  };
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const submitRating = async () => {
    await submitRatingFromContext();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient 
          colors={isDark ? ['#1A0B2E', '#2D0B5A', '#0F041A'] : ['#FFF5F7', '#FFE4E9', '#FFFFFF']} 
          style={StyleSheet.absoluteFillObject} 
        />
        {/* Animated Mesh Blobs */}
        <Animated.View style={[styles.meshBlob, { backgroundColor: isDark ? '#4D1D95' : '#FFD6E0', top: '10%', left: '-20%', width: width * 1.2, height: width * 1.2, opacity: 0.4, transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.meshBlob, { backgroundColor: isDark ? '#1E40AF' : '#E0E7FF', bottom: '15%', right: '-25%', width: width * 1.4, height: width * 1.4, opacity: 0.3, transform: [{ scale: pulseAnim }] }]} />
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={minimizeCall} style={styles.backBtn}><Ionicons name="chevron-down" size={32} color={colors.text} /></TouchableOpacity>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(seconds)}</Text>
          <View style={styles.liveIndicator} />
        </View>
        {session && role === 'receiver' && (
          <TouchableOpacity onPress={handleBlock} style={styles.blockBtn}>
            <Ionicons name="hand-left" size={20} color="#FF4D67" />
            <Text style={styles.blockText}>Block</Text>
          </TouchableOpacity>
        )}
      </View>
      {giftNotification && <View style={styles.notificationBubble}><Text style={styles.notificationText}>{giftNotification}</Text></View>}
      <View style={styles.mainArea}>
        {(loading || session?.status === 'ringing') ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4D67" />
            <Text style={[styles.loadingText, { color: colors.subText }]}>{role === 'caller' ? (session?.status === 'ringing' ? 'Ringing...' : 'Calling...') : 'Connecting...'}</Text>
          </View>
        ) : (
          type === 'video' ? (
            <View style={styles.videoContainer}>
              {remoteUid ? (
                <RtcSurfaceView uid={remoteUid} style={styles.remoteVideo} />
              ) : (
                <View style={styles.remotePlaceholder}>
                  <Image source={getAvatarSource(role === 'caller' ? session?.receiverAvatar : session?.callerAvatar, role === 'caller' ? 'woman' : 'man')} style={styles.placeholderAvatarLarge} />
                  <Text style={styles.placeholderText}>Connecting to peer...</Text>
                  <ActivityIndicator color="#FF4D67" style={{ marginTop: 20 }} />
                </View>
              )}
              <View style={styles.localVideoContainer}><RtcSurfaceView uid={0} style={styles.localVideo} /></View>
            </View>
          ) : (
            <View style={styles.audioContainer}>
              <View style={styles.avatarWrapper}>
                <Animated.View style={[
                  styles.avatarGlow, 
                  { 
                    transform: [{ scale: pulseAnim }], 
                    shadowColor: '#FFD700', 
                    shadowOpacity: 0.8, 
                    shadowRadius: 40, 
                    elevation: 25 
                  }
                ]}>
                    <Image source={getAvatarSource(role === 'caller' ? session?.receiverAvatar : session?.callerAvatar, role === 'caller' ? 'woman' : 'man')} style={styles.audioAvatar} />
                </Animated.View>

                {/* Centered Gifting Animations Overlay */}
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 5000 }]} pointerEvents="none">
                  {coinJumps.map(jump => (
                    <CoinJump key={jump.id} onComplete={() => handleJumpComplete(jump.id)} />
                  ))}
                </View>

                {role === 'caller' && (
                  <View style={{ position: 'relative' }}>
                    {heartPops.map(heart => (
                      <HeartPop key={heart.id} x={heart.x} y={heart.y} onComplete={() => setHeartPops(prev => prev.filter(h => h.id !== heart.id))} />
                    ))}
                    <TouchableOpacity 
                      style={[styles.heartBadge, isBestie && styles.activeHeartBadge]} 
                      onPress={handleToggleBestie}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={isBestie ? "heart" : "heart-outline"} size={24} color="#fff" />
                      {!isBestie && <View style={styles.priceTag}><Text style={styles.priceTagText}>10</Text></View>}
                    </TouchableOpacity>
                    {/* Gift Badge (Left) */}
                    <View style={styles.giftBadgeContainer}>
                      <TouchableOpacity 
                        style={styles.giftBadge} 
                        onPress={toggleGiftMenu}
                        activeOpacity={0.85}
                      >
                        <LinearGradient 
                          colors={['#FFD700', '#FFA500']} 
                          style={styles.giftBadgeGradient}
                        >
                          <FontAwesome5 name="gift" size={20} color="#4A2F00" />
                        </LinearGradient>
                        <Animated.View style={[styles.giftBadgeGlow, { opacity: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [0.3, 0.6] }) }]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{role === 'caller' ? session?.receiverName : session?.callerName}</Text>
              
              <View style={styles.waveformRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((i, idx) => (
                  <Animated.View 
                    key={idx} 
                    style={[
                      styles.waveformBar, 
                      { 
                        height: 8 + Math.random() * 20,
                        backgroundColor: colors.primary,
                        transform: [{ 
                          scaleY: pulseAnim.interpolate({
                            inputRange: [1, 1.1],
                            outputRange: [1, 1.5 + (i % 3) * 0.3]
                          }) 
                        }]
                      }
                    ]} 
                  />
                ))}
              </View>

              {!remoteUid && seconds === 0 && (
                <View style={styles.connectingStatus}>
                  <ActivityIndicator size="small" color="#FF4D67" />
                  <Text style={styles.connectingText}>
                    {role === 'caller' ? 'Waiting for creator to connect...' : 'Connecting to user...'}
                  </Text>
                </View>
              )}
            </View>
          )
        )}
      </View>

      <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.controlsContainer, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.mainControls}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: isMuted ? 'rgba(255, 77, 103, 0.25)' : 'rgba(255,255,255,0.1)' }]} onPress={toggleMute}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? '#FF4D67' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveBtn} onPress={endCall} activeOpacity={0.9}>
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.leaveGradient}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: isSpeaker ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.1)' }]} onPress={toggleSpeaker}>
            <Ionicons name={isSpeaker ? "volume-high" : "volume-medium"} size={28} color={isSpeaker ? '#10B981' : colors.text} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <Modal transparent visible={showGiftMenu} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGiftMenu(false)}>
          <View style={styles.bottomSheetContainer}>
            <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={styles.bottomSheet}>
              <View style={styles.sheetGrabber} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Send a Gift</Text>
              
              <View style={styles.tokenGrid}>
                {[20, 50, 100, 500].map(amount => (
                  <TouchableOpacity key={amount} style={styles.gridTokenWrapper} onPress={() => handleSendGift(amount)}>
                    <LinearGradient
                      colors={['#FFFACD', '#FFD700', '#DAA520']}
                      style={styles.gridTokenCircle}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.gridTokenInner}>
                        <FontAwesome5 name="coins" size={18} color="#4A2F00" />
                        <Text style={styles.gridTokenText}>{amount}</Text>
                      </View>
                      <View style={styles.tokenReflect} />
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
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Rate Your Call</Text>
            <Text style={[styles.ratingSub, { color: colors.subText }]}>How was your conversation with {session?.receiverName}?</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Ionicons
                    name={userRating >= star ? "star" : "star-outline"}
                    size={40}
                    color={userRating >= star ? "#FFD700" : colors.subText}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitRatingBtn, { opacity: userRating === 0 ? 0.5 : 1 }]}
              onPress={submitRating}
              disabled={userRating === 0}
            >
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={skipRating}
            >
              <Text style={[styles.skipText, { color: colors.subText }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: { padding: 5 },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4D67' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 77, 103, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  blockText: { color: '#FF4D67', fontWeight: '800', fontSize: 12 },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { alignItems: 'center', gap: 15 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  videoContainer: { width: '100%', flex: 1 },
  remoteVideo: { flex: 1 },
  localVideoContainer: { position: 'absolute', top: 20, right: 20, width: 110, height: 160, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  localVideo: { flex: 1 },
  remotePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E24' },
  placeholderAvatarLarge: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#FF4D67', marginBottom: 20 },
  placeholderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  audioContainer: { alignItems: 'center' },
  avatarGlow: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 77, 103, 0.1)', justifyContent: 'center', alignItems: 'center' },
  audioAvatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#FF4D67' },
  connectingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
  connectingText: { color: '#FF4D67', fontSize: 11, fontWeight: '700' },
  controlsContainer: { paddingBottom: 40, paddingTop: 25, paddingHorizontal: 30, borderTopLeftRadius: 50, borderTopRightRadius: 50, borderTopWidth: 1.5, overflow: 'hidden' },
  avatarWrapper: { position: 'relative', marginBottom: 25 },
  heartBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6
  },
  activeHeartBadge: { backgroundColor: '#FF4D67', borderColor: '#FF4D67' },
  userName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 8 },
  mainControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  leaveBtn: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', shadowColor: '#FF4D67', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  leaveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  giftBadgeContainer: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    zIndex: 2000,
  },
  giftBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  giftBadgeGradient: {
    flex: 1,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftBadgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: -1,
  },
  tokenReflect: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 35,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ rotate: '45deg' }]
  },
  bottomSheetContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  bottomSheet: {
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 25,
    textAlign: 'center',
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridTokenWrapper: {
    width: '47%',
    alignItems: 'center',
    gap: 8,
  },
  gridTokenCircle: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gridTokenInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridTokenText: {
    color: '#4A2F00',
    fontSize: 22,
    fontWeight: '900',
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notificationBubble: { position: 'absolute', top: 110, alignSelf: 'center', backgroundColor: '#FF4D67', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, zIndex: 100 },
  notificationText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ratingCard: { width: '100%', padding: 30, borderRadius: 30, alignItems: 'center', gap: 20 },
  ratingTitle: { fontSize: 24, fontWeight: '800' },
  ratingSub: { fontSize: 14, textAlign: 'center', opacity: 0.8 },
  starsRow: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  submitRatingBtn: { width: '100%', height: 56, backgroundColor: '#FF4D67', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitRatingText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 14, fontWeight: '600' },
  meshBlob: {
    position: 'absolute',
    borderRadius: 999,
    filter: 'blur(80px)',
  },
  priceTag: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A2F00',
  },
  priceTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4A2F00',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    marginVertical: 15,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
});
