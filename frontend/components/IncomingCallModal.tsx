import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CallSession, getAvatarSource } from '../services/firebaseService';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  session: CallSession | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ visible, session, onAccept, onReject }: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [visible]);

  if (!session) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
          <Text style={styles.incomingText}>INCOMING {session.type.toUpperCase()} CALL</Text>
          
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Image 
              source={getAvatarSource(session.callerAvatar, 'man')} 
              style={styles.avatar} 
            />
            <View style={styles.pulseRing} />
          </Animated.View>

          <Text style={styles.callerName}>{session.callerName}</Text>
          <Text style={styles.callerSub}>Is calling you...</Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]} 
              onPress={onReject}
            >
              <Ionicons name="close" size={32} color="#fff" />
              <Text style={styles.btnLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={onAccept}
            >
              <Ionicons 
                name={session.type === 'video' ? 'videocam' : 'call'} 
                size={32} 
                color="#fff" 
              />
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  incomingText: {
    color: '#FF4D67',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#FF4D67',
  },
  pulseRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 103, 0.3)',
  },
  callerName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  callerSub: {
    color: '#a0a0a0',
    fontSize: 16,
    marginBottom: 80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
  },
  acceptBtn: {
    backgroundColor: '#4CD964',
  },
  btnLabel: {
    position: 'absolute',
    bottom: -30,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});
