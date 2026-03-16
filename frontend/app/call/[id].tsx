import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToCallSession, updateCallSession, CallSession, getAvatarSource, executeCallTransfer, recordCallRecord, blockUser, sendGift, toggleFavorite, updateCallSessionMeta, updateCreatorRating } from '../../services/firebaseService';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CallSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  const [isBestie, setIsBestie] = useState(false);
  const [giftNotification, setGiftNotification] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  const engine = useRef<IRtcEngine | null>(null);
  const billingCountRef = useRef(0);

  // Initialize Agora
  useEffect(() => {
    const init = async () => {
      try {
        if (!AGORA_APP_ID) {
          console.error('Agora App ID is missing');
          return;
        }

        engine.current = createAgoraRtcEngine();
        engine.current.initialize({
          appId: AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('[Agora] onJoinChannelSuccess', connection.channelId, elapsed);
          setJoined(true);
          setLoading(false);
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          console.log('[Agora] onUserJoined', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
          console.log('[Agora] onUserOffline', remoteUid, reason);
          setRemoteUid(null);
          leaveCall();
        },
        onError: (err: any, msg: string) => {
          console.error('[Agora] Error:', err, msg);
        },
        onLeaveChannel: (connection: RtcConnection, stats: any) => {
          console.log('[Agora] onLeaveChannel', stats);
        }
      });

        engine.current.enableAudio();
        if (type === 'video') {
          engine.current.enableVideo();
          engine.current.startPreview();
        }
        
        engine.current.joinChannel(null, id as string, 0, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });
      } catch (e) {
        console.error('Agora Init Error:', e);
        setTimeout(() => {
           setJoined(true);
           setLoading(false);
        }, 2000);
      }
    };

    init();
    return () => {
      engine.current?.leaveChannel();
      engine.current?.release();
    };
  }, [id]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === 'accepted') {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000) as any;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status]);

  // Billing Logic
  useEffect(() => {
    if (role === 'caller' && session?.status === 'accepted') {
      const amount = type === 'audio' ? 10 : 60;
      const currentMinute = Math.floor(seconds / 60);
      
      if (currentMinute >= billingCountRef.current) {
        if (appUser && appUser.coins < amount) {
          Alert.alert('Insufficient Balance', 'Your call ended due to insufficient gold.');
          leaveCall();
          return;
        }
        const performDeduction = async () => {
          const success = await executeCallTransfer(session.callerId, session.receiverId, amount, type as 'audio' | 'video');
          if (success) {
            billingCountRef.current += 1;
          } else {
            Alert.alert('Error', 'Billing failed. Ending call.');
            leaveCall();
          }
        };
        performDeduction();
      }
    }
  }, [seconds, session?.status, role, appUser?.coins]);

  // Session Subscription
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToCallSession(id as string, (updatedSession) => {
      setSession(updatedSession);
      if (!updatedSession) {
        router.back();
        return;
      }
      if (updatedSession.status === 'ended') {
        if (role === 'caller' && seconds > 0) {
          setShowRatingModal(true);
        } else {
          router.replace(role === 'caller' ? '/(men)' : '/(women)');
        }
      }
      if (updatedSession.status === 'rejected' && role === 'caller') {
        Alert.alert('Call Declined', 'The creator declined the call.');
        router.replace('/(men)');
      }
    });
    return () => unsubscribe();
  }, [id, role]);

  // Bestie & Gift Notifications
  useEffect(() => {
    if (appUser && session) {
      const creatorId = role === 'caller' ? session.receiverId : session.callerId;
      setIsBestie(appUser.besties?.includes(creatorId) || false);
    }
    if (session?.meta?.lastGift && role === 'receiver') {
      const gift = session.meta.lastGift;
      setGiftNotification(`Received ${gift.amount} Gold! ✨`);
      setTimeout(() => setGiftNotification(null), 5000);
    }
  }, [appUser?.besties, session?.meta?.lastGift, role]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    engine.current?.muteLocalAudioStream(nextMute);
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeaker;
    setIsSpeaker(nextSpeaker);
    engine.current?.setEnableSpeakerphone(nextSpeaker);
  };

  const leaveCall = async () => {
    if (id) {
       await updateCallSession(id as string, 'ended');
       if (role === 'caller' && session && seconds > 0) {
         const amount = type === 'audio' ? 10 : 60;
         await recordCallRecord({
           callerId: session.callerId,
           callerName: session.callerName,
           callerAvatar: session.callerAvatar,
           receiverId: session.receiverId,
           receiverName: session.receiverName,
           receiverAvatar: session.receiverAvatar,
           duration: formatHistoryDuration(seconds),
           durationInMinutes: billingCountRef.current,
           cost: Math.max(1, billingCountRef.current) * amount,
           type: type as 'audio' | 'video',
           timestamp: null
         });
       }
    }
    engine.current?.leaveChannel();
    engine.current?.release();
    engine.current = null;

    if (role === 'caller' && seconds > 0) {
      setShowRatingModal(true);
    } else {
      router.back();
    }
  };

  const handleBlock = async () => {
    if (!session || !appUser) return;
    const targetId = role === 'caller' ? session.receiverId : session.callerId;
    Alert.alert("Block User", "End call and block this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
          await blockUser(appUser.id, targetId);
          await leaveCall();
      }}
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
      Alert.alert("Add Bestie", "Add to Besties for 10 gold?", [
        { text: "Cancel", style: "cancel" },
        { text: "Add (10 Gold)", onPress: async () => {
            const success = await sendGift(appUser.id, creatorId, 10);
            if (success) {
              await toggleFavorite(appUser.id, creatorId, true);
              setIsBestie(true);
            }
        }}
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
    const success = await sendGift(appUser.id, session.receiverId, amount);
    if (success) {
      await updateCallSessionMeta(id as string, { lastGift: { amount, timestamp: Date.now() } });
      setShowGiftOptions(false);
    }
  };

  const formatHistoryDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const submitRating = async () => {
    if (!session || userRating === 0) return;
    await updateCreatorRating(session.receiverId, userRating);
    setShowRatingModal(false);
    router.replace('/(men)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={isDark ? ['rgba(255, 77, 103, 0.15)', colors.bg] : ['rgba(236, 72, 153, 0.1)', colors.bg]} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={leaveCall} style={styles.backBtn}><Ionicons name="chevron-down" size={32} color={colors.text} /></TouchableOpacity>
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
              <View style={styles.avatarGlow}>
                <Image source={getAvatarSource(role === 'caller' ? session?.receiverAvatar : session?.callerAvatar, role === 'caller' ? 'woman' : 'man')} style={styles.audioAvatar} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{role === 'caller' ? session?.receiverName : session?.callerName}</Text>
              {!remoteUid && joined && seconds === 0 && (
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

      <View style={[styles.controlsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.actionsRow}>
           {role === 'caller' && (
             <>
               <TouchableOpacity style={[styles.actionBtn, isBestie && styles.activeActionBtn]} onPress={handleToggleBestie}>
                 <Ionicons name={isBestie ? "heart" : "heart-outline"} size={22} color={isBestie ? "#fff" : "#FF4D67"} />
               </TouchableOpacity>
               <TouchableOpacity style={styles.actionBtn} onPress={() => setShowGiftOptions(!showGiftOptions)}>
                 <FontAwesome5 name="gift" size={18} color="#FFD700" />
               </TouchableOpacity>
             </>
           )}
        </View>

        <View style={styles.mainControls}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: isMuted ? 'rgba(255, 77, 103, 0.2)' : colors.bg }]} onPress={toggleMute}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? '#FF4D67' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveBtn} onPress={leaveCall}>
            <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: isSpeaker ? 'rgba(16, 185, 129, 0.2)' : colors.bg }]} onPress={toggleSpeaker}>
            <Ionicons name={isSpeaker ? "volume-high" : "volume-medium"} size={26} color={isSpeaker ? '#10B981' : colors.text} />
          </TouchableOpacity>
        </View>

        {showGiftOptions && (
          <View style={styles.giftOptions}>
            {[20, 50, 100, 500].map(amount => (
              <TouchableOpacity key={amount} style={styles.giftChip} onPress={() => handleSendGift(amount)}>
                <FontAwesome5 name="coins" size={10} color="#FFD700" />
                <Text style={styles.giftAmount}>{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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
              onPress={() => {
                setShowRatingModal(false);
                router.replace('/(men)');
              }}
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
  avatarGlow: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 77, 103, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  audioAvatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#FF4D67' },
  userName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  callDuration: { fontSize: 16, fontWeight: '600', opacity: 0.7, color: '#FF4D67' },
  connectingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
  connectingText: { color: '#FF4D67', fontSize: 11, fontWeight: '700' },
  controlsContainer: { paddingVertical: 25, paddingHorizontal: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 1 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 20 },
  actionBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeActionBtn: { backgroundColor: '#FF4D67', borderColor: '#FF4D67' },
  mainControls: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  controlBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  leaveBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FF4D67', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF4D67', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  giftOptions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 15, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 15 },
  giftChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 5, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  giftAmount: { color: '#FFD700', fontWeight: '800', fontSize: 12 },
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
});
