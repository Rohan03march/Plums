import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Basic entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      // Pulsing glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      )
    ]).start();

    // Subtle bobbing effect for the characters
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(async () => {
        if (user) {
          if (appUser?.isProfileComplete) {
            router.replace(appUser.role === 'man' ? '/(men)' : '/(women)');
          } else {
            router.replace('/role');
          }
        } else {
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          if (hasSeenOnboarding === 'true') {
            router.replace('/login');
          } else {
            router.replace('/onboarding');
          }
        }
      }, 3500); // Slightly longer for the premium animation feel

      return () => clearTimeout(timer);
    }
  }, [loading, user, appUser]);

  return (
    <View style={styles.container}>
      {/* Premium Gradient Background */}
      <LinearGradient
        colors={['#2E1A47', '#1A0B2E', '#0F0F13']}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Soft Glow */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: bobAnim }] }]}>
        <Image
          source={require('../assets/images/friend_plums.png')}
          style={styles.logo}
          contentFit="contain"
          transition={800}
        />

        <View style={styles.brandContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Plum</Text>
            <Animated.View style={[styles.apostropheContainer, { transform: [{ scale: glowAnim }] }]}>
              <Ionicons name="heart" size={36} color="#FF2D55" />
            </Animated.View>
            <Text style={styles.title}>s</Text>
          </View>
          <Text style={styles.slogan}>Sweet bond, sweet friendship</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {loading && <ActivityIndicator size="small" color="#FF2D5580" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255, 45, 85, 0.05)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  logo: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 10,
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  apostropheContainer: {
    marginTop: -18,
    marginHorizontal: -6,
  },
  slogan: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  }
});
