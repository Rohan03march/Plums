import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getAvatarSource } from '../../services/firebaseService';

interface AudioCallViewProps {
  session: any;
  participant: { name: string; avatar: string | null; gender: 'woman' | 'man' } | null;
  role: 'caller' | 'receiver';
  remoteUid: number | null;
  seconds: number;
  isMuted: boolean;
  isSpeaker: boolean;
  toggleMute: () => void;
  toggleSpeaker: () => void;
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
  giftNotification: string | null;
}

export const AudioCallView: React.FC<AudioCallViewProps> = React.memo(({
  session,
  participant,
  role,
  remoteUid,
  seconds,
  isMuted,
  isSpeaker,
  toggleMute,
  toggleSpeaker,
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
  giftNotification,
}) => {
  const safeColors = colors || { text: '#fff', bg: '#000', subText: '#ccc', primary: '#FF4D67' };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#0F041A'] : ['#FFF5F7', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={minimizeCall} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={32} color={safeColors.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {session && role === 'receiver' && (
            <TouchableOpacity onPress={handleBlock} style={styles.blockBtn}>
              <Ionicons name="hand-left" size={18} color="#FF4D67" />
              <Text style={styles.blockText}>Block</Text>
            </TouchableOpacity>
          )}
          <View style={styles.timerRightContainer}>
            <Ionicons name="time-outline" size={14} color={safeColors.text} style={{ opacity: 0.7 }} />
            <Text style={[styles.durationText, { color: safeColors.text }]}>{formatTime(seconds)}</Text>
          </View>
        </View>
      </View>

      {giftNotification && (
        <View style={styles.notificationBubble}>
          <Text style={styles.notificationText}>{giftNotification}</Text>
        </View>
      )}

      <View style={styles.mainArea}>
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
              <Image
                source={getAvatarSource(
                  participant?.avatar || (role === 'caller' ? session?.receiverAvatar : session?.callerAvatar),
                  participant?.gender || (role === 'caller' ? 'woman' : 'man')
                )}
                style={styles.audioAvatar}
              />
            </Animated.View>

            {/* Pulsing mesh effect behind avatar */}
            <Animated.View style={[
              styles.meshCircle,
              {
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [1, 1.4] }) }],
                opacity: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [0.1, 0.3] })
              }
            ]} />

            {role === 'caller' && remoteUid && (
              <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
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
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.userName, { color: safeColors.text }]}>
            {participant?.name || (role === 'caller' ? session?.receiverName : session?.callerName)}
          </Text>

          {remoteUid && (
            <View style={styles.waveformRow}>
              {[1, 2, 3, 4, 3, 2, 1, 2, 3].map((i, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    {
                      height: 12 + i * 4,
                      backgroundColor: '#FF4D67',
                      transform: [{
                        scaleY: pulseAnim.interpolate({
                          inputRange: [1, 1.1],
                          outputRange: [1, 1.4 + (idx % 2) * 0.2]
                        })
                      }]
                    }
                  ]}
                />
              ))}
            </View>
          )}

          {!remoteUid && seconds === 0 && (
            <View style={styles.connectingStatus}>
              <ActivityIndicator size="small" color="#FF4D67" />
              <Text style={styles.connectingText}>
                {role === 'caller'
                  ? `Waiting for ${participant?.name || session?.receiverName || 'Creator'} to connect...`
                  : `Connecting to ${participant?.name || session?.callerName || 'User'}...`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.controlsContainer, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)' }]}
      >
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isMuted ? 'rgba(255, 77, 103, 0.25)' : 'rgba(255,255,255,0.08)' }]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? '#FF4D67' : safeColors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveBtn} onPress={endCall} activeOpacity={0.9}>
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.leaveGradient}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isSpeaker ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)' }]}
            onPress={toggleSpeaker}
          >
            <Ionicons name={isSpeaker ? "volume-high" : "volume-medium"} size={28} color={isSpeaker ? '#10B981' : safeColors.text} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
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
  timerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  durationText: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace', opacity: 0.9 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 77, 103, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  blockText: { color: '#FF4D67', fontWeight: '800', fontSize: 12 },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingBottom: 100 },
  audioContainer: { alignItems: 'center', width: '100%', zIndex: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 30, justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255, 77, 103, 0.1)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  meshCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#FF4D67', zIndex: 1 },
  audioAvatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#FF4D67' },
  userName: { fontSize: 28, fontWeight: '900', letterSpacing: 0.5, marginBottom: 15, textAlign: 'center' },
  waveformRow: { flexDirection: 'row', gap: 6, alignItems: 'center', height: 40 },
  waveformBar: { width: 4, borderRadius: 2 },
  connectingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  connectingText: { color: '#FF4D67', fontSize: 14, fontWeight: '700' },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 20,
    paddingHorizontal: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
  },
  mainControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  controlBtn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  leaveBtn: { width: 76, height: 76, borderRadius: 38, overflow: 'hidden', shadowColor: '#FF4D67', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  leaveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heartBadge: {
    position: 'absolute',
    bottom: 5,
    right: -40,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 100,
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
  giftBadgeContainer: { position: 'absolute', bottom: 5, left: -40, zIndex: 100 },
  giftBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFD700', overflow: 'hidden', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  giftBadgeGradient: { flex: 1, padding: 3, justifyContent: 'center', alignItems: 'center' },
  notificationBubble: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'rgba(255, 77, 103, 0.9)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, zIndex: 1000 },
  notificationText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
