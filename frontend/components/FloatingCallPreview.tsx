import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';
import { useTheme } from '../context/ThemeContext';
import { getAvatarSource } from '../services/firebaseService';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function FloatingCallPreview() {
  const { activeCall, isMinimized, seconds, restoreCall, endCall } = useCall();
  const { colors, isDark } = useTheme();

  if (!activeCall || !isMinimized) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
       <TouchableOpacity activeOpacity={0.9} onPress={restoreCall}>
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={styles.blurContent}>
            <View style={styles.left}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={getAvatarSource(activeCall.receiverAvatar, 'woman')} 
                  style={styles.avatar} 
                />
                <View style={styles.livePulse} />
              </View>
              <View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{activeCall.receiverName}</Text>
                <Text style={[styles.timer, { color: '#FF4D67' }]}>{formatTime(seconds)}</Text>
              </View>
            </View>

            <View style={styles.right}>
              <TouchableOpacity style={styles.restoreBtn} onPress={restoreCall}>
                <Ionicons name="expand" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.endBtn} onPress={endCall}>
                <Ionicons name="call" size={18} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </BlurView>
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  blurContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FF4D67',
  },
  livePulse: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#000',
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 120,
  },
  timer: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4D67',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
