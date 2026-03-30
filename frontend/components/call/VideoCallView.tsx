import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RtcSurfaceView } from '../../services/agoraService';
import { getAvatarSource } from '../../services/firebaseService';

interface VideoCallViewProps {
  session: any;
  participant: { name: string; avatar: string | null; gender: 'woman' | 'man' } | null;
  role: 'caller' | 'receiver';
  remoteUid: number | null;
  seconds: number;
  isMuted: boolean;
  isCameraOn: boolean;
  isEngineReady: boolean;
  isLocalVideoMain: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleVideoSwap: () => void;
  endCall: () => void;
  minimizeCall: () => void;
  handleBlock: () => void;
  formatTime: (secs: number) => string;
  colors: any;
  isDark: boolean;
  pulseAnim: Animated.Value;
  isBestie: boolean;
  handleToggleBestie: () => void;
  toggleGiftMenu: () => void;
  coinJumps: { id: number }[];
  heartPops: { id: number; x: number; y: number }[];
  handleJumpComplete: (id: number) => void;
  setHeartPops: React.Dispatch<React.SetStateAction<{ id: number; x: number; y: number }[]>>;
  giftNotification: string | null;
  HeartPop: React.ComponentType<any>;
}

export const VideoCallView: React.FC<VideoCallViewProps> = ({
  session,
  participant,
  role,
  remoteUid,
  seconds,
  isMuted,
  isCameraOn,
  isEngineReady,
  isLocalVideoMain,
  toggleMute,
  toggleCamera,
  toggleVideoSwap,
  endCall,
  minimizeCall,
  handleBlock,
  formatTime,
  colors,
  isDark,
  pulseAnim,
  isBestie,
  handleToggleBestie,
  toggleGiftMenu,
  coinJumps,
  heartPops,
  handleJumpComplete,
  setHeartPops,
  giftNotification,
  HeartPop
}) => {
  const safeColors = colors || { text: '#fff', bg: '#000', subText: '#ccc', primary: '#FF4D67' };
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  // --- Animation State ---
  const isVisible = useSharedValue(1); // 1 = visible, 0 = hidden

  // PiP Position (using translation offsets)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });

  // UI Animation Styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(isVisible.value === 1 ? 0 : -150) }],
    opacity: withTiming(isVisible.value),
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(isVisible.value === 1 ? 0 : 200) }],
    opacity: withTiming(isVisible.value === 1 ? 1 : 0),
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isVisible.value === 1 ? 1 : 0),
    transform: [{ scale: withTiming(isVisible.value === 1 ? 1 : 0.8) }],
  }));

  const pipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  // --- Gestures ---

  // Toggle Controls Visibility
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      isVisible.value = isVisible.value === 1 ? 0 : 1;
    });

  // Draggable PiP
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
    })
    .onEnd((event) => {
      // Logic to snap to corners
      // Standard positions are top: 110, right: 20
      // PiP is 100x140
      const snapPointsX = [0, -(SCREEN_WIDTH - 140)]; // Right edge (0) or Left edge
      const snapPointsY = [0, SCREEN_HEIGHT - 290 - 110]; // Top (0) or Bottom

      const destinationX = translateX.value > -(SCREEN_WIDTH / 2) + 50 ? 0 : -(SCREEN_WIDTH - 140);
      const destinationY = translateY.value < (SCREEN_HEIGHT / 2) - 150 ? 0 : SCREEN_HEIGHT - 290 - 110;

      translateX.value = withSpring(destinationX);
      translateY.value = withSpring(destinationY);
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tapGesture}>
        <Reanimated.View style={[StyleSheet.absoluteFillObject, styles.videoContainer]}>
          {/* Background Video (Main) */}
          {!isLocalVideoMain ? (
            // Remote is Main
            isEngineReady && remoteUid ? (
              <RtcSurfaceView key={`remote-${remoteUid}`} canvas={{ uid: remoteUid }} style={styles.remoteVideo} />
            ) : (
              <View style={styles.remotePlaceholder}>
                <LinearGradient
                  colors={['#1A0B2E', '#0F041A']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Image
                  source={getAvatarSource(
                    participant?.avatar || (role === 'caller' ? session?.receiverAvatar : session?.callerAvatar),
                    participant?.gender || (role === 'caller' ? 'woman' : 'man')
                  )}
                  style={styles.placeholderAvatarLarge}
                />
                <Text style={styles.placeholderText}>
                  {role === 'caller'
                    ? (session?.status === 'ringing'
                      ? `Ringing ${participant?.name || session?.receiverName || 'Creator'}...`
                      : `Waiting for ${participant?.name || session?.receiverName || 'Creator'}...`)
                    : `Connecting to ${participant?.name || session?.callerName || 'User'}...`}
                </Text>
                <ActivityIndicator color="#FF4D67" style={{ marginTop: 20 }} />
              </View>
            )
          ) : (
            // Local is Main
            isEngineReady && isCameraOn ? (
              <RtcSurfaceView key="local-main" canvas={{ uid: 0 }} style={styles.remoteVideo} />
            ) : (
              <View style={styles.remotePlaceholder}>
                <LinearGradient
                  colors={['#1A0B2E', '#0F041A']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="videocam-off" size={64} color="#FF4D67" />
                <Text style={[styles.placeholderText, { marginTop: 20 }]}>Camera is Off</Text>
              </View>
            )
          )}

          {/* Top Gradient for Header contrast */}
          <Reanimated.View style={[StyleSheet.absoluteFillObject, { height: 180, zIndex: 50 }, headerAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Reanimated.View>

          {/* Caller Interaction Badges for Video */}
          {role === 'caller' && remoteUid && (
            <Reanimated.View style={[styles.videoInteractionOverlay, overlayAnimatedStyle]}>
              {heartPops.map(heart => (
                <HeartPop
                  key={heart.id}
                  x={heart.x}
                  y={heart.y}
                  onComplete={() => setHeartPops(prev => prev.filter(h => h.id !== heart.id))}
                />
              ))}
              <TouchableOpacity
                style={[styles.heartBadge, isBestie && styles.activeHeartBadge]}
                onPress={handleToggleBestie}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isBestie ? "heart" : "heart-outline"} 
                  size={26} 
                  color={isBestie ? "#fff" : "#fff"} 
                />
                {!isBestie && <View style={styles.priceTag}><Text style={styles.priceTagText}>10</Text></View>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.giftBadge, { marginTop: 15 }]}
                onPress={toggleGiftMenu}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.giftBadgeGradient}
                >
                  <FontAwesome5 name="gift" size={20} color="#4A2F00" />
                </LinearGradient>
              </TouchableOpacity>
            </Reanimated.View>
          )}

          {/* Foreground Video (Overlay/PiP) */}
          <GestureDetector gesture={panGesture}>
            <Reanimated.View style={[styles.localVideoContainer, pipAnimatedStyle]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={toggleVideoSwap} activeOpacity={0.9}>
                {isLocalVideoMain ? (
                  // Remote is Overlay
                  isEngineReady && remoteUid ? (
                    <RtcSurfaceView key={`remote-pip-${remoteUid}`} canvas={{ uid: remoteUid }} style={styles.localVideo} zOrderMediaOverlay={true} />
                  ) : (
                    <View style={[styles.localVideo, { backgroundColor: '#1A0B2E', justifyContent: 'center', alignItems: 'center' }]}>
                      <Image source={getAvatarSource(participant?.avatar || undefined, participant?.gender === 'man' ? 'man' : 'woman')} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    </View>
                  )
                ) : (
                  // If Remote is Main, PiP shows Local
                  isEngineReady && isCameraOn ? (
                    <RtcSurfaceView key="local-pip" canvas={{ uid: 0 }} style={styles.localVideo} zOrderMediaOverlay={true} />
                  ) : (
                    <View style={[styles.localVideo, { backgroundColor: '#1E1E24', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="videocam-off" size={24} color="#FF4D67" />
                    </View>
                  )
                )}
              </TouchableOpacity>
            </Reanimated.View>
          </GestureDetector>
        </Reanimated.View>
      </GestureDetector>

      <Reanimated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity onPress={minimizeCall} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {session && role === 'receiver' && (
            <TouchableOpacity onPress={handleBlock} style={styles.blockBtn}>
              <Ionicons name="hand-left" size={18} color="#FF4D67" />
              <Text style={styles.blockText}>Block</Text>
            </TouchableOpacity>
          )}
          <View style={styles.timerRightContainer}>
            <Ionicons name="time-outline" size={14} color="#fff" style={{ opacity: 0.7 }} />
            <Text style={[styles.durationText, { color: '#fff' }]}>{formatTime(seconds)}</Text>
          </View>
        </View>
      </Reanimated.View>

      {giftNotification && (
        <View style={styles.notificationBubble}>
          <Text style={styles.notificationText}>{giftNotification}</Text>
        </View>
      )}

      <Reanimated.View
        style={[
          styles.controlsContainer,
          { borderColor: 'rgba(255,255,255,0.12)' },
          footerAnimatedStyle
        ]}
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isMuted ? 'rgba(255, 77, 103, 0.25)' : 'rgba(255,255,255,0.1)' }]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? '#FF4D67' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveBtn} onPress={endCall} activeOpacity={0.9}>
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.leaveGradient}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isCameraOn ? 'rgba(255,255,255,0.08)' : 'rgba(255, 77, 103, 0.25)' }]}
            onPress={toggleCamera}
          >
            <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={28} color={isCameraOn ? '#fff' : '#FF4D67'} />
          </TouchableOpacity>
        </View>
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: { backgroundColor: '#000', flex: 1 },
  remoteVideo: { flex: 1 },
  localVideoContainer: {
    position: 'absolute',
    top: 110,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    backgroundColor: '#000',
    zIndex: 5000,
  },
  localVideo: { flex: 1 },
  remotePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderAvatarLarge: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#FF4D67', marginBottom: 20, zIndex: 10 },
  placeholderText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5, zIndex: 10 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: { padding: 5 },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  timerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  durationText: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace', opacity: 0.9 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 77, 103, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  blockText: { color: '#FF4D67', fontWeight: '800', fontSize: 12 },
  videoInteractionOverlay: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    alignItems: 'center',
    zIndex: 1000,
  },
  heartBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  activeHeartBadge: { backgroundColor: '#FF0000', borderColor: '#FF0000' },
  priceTag: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A2F00',
  },
  priceTagText: { fontSize: 10, fontWeight: '900', color: '#4A2F00' },
  giftBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFD700', overflow: 'hidden', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  giftBadgeGradient: { flex: 1, padding: 3, justifyContent: 'center', alignItems: 'center' },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    paddingTop: 25,
    paddingHorizontal: 35,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderTopWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
  },
  mainControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 },
  controlBtn: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center' },
  leaveBtn: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', shadowColor: '#FF4D67', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 },
  leaveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notificationBubble: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'rgba(255, 77, 103, 0.95)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, zIndex: 2000 },
  notificationText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
