import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withRepeat,
  withSequence,
  withSpring,
  Easing 
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  // Animation Shared Values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20);
  const contentOpacity = useSharedValue(0);
  const orb1Opacity = useSharedValue(0);
  const orb2Opacity = useSharedValue(0);

  useEffect(() => {
    // Initial Entry Animations
    logoScale.value = withSpring(1, { damping: 12 });
    logoOpacity.value = withTiming(1, { duration: 1000 });
    logoTranslateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    contentOpacity.value = withDelay(400, withTiming(1, { duration: 1000 }));
    
    // Background Orbs
    orb1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 3000 }),
        withTiming(0.3, { duration: 3000 })
      ),
      -1,
      true
    );
    orb2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 4000 }),
        withTiming(0.1, { duration: 4000 })
      ),
      -1,
      true
    );
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
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [loading, user, appUser]);

  // Animated Styles
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value }
    ],
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1Opacity.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Deep Layered Gradient */}
      <LinearGradient
        colors={['#1A0B2E', '#0F0F13']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Dynamic Animated Orbs */}
      <Animated.View style={[styles.orb1, orb1Style]} />
      <Animated.View style={[styles.orb2, orb2Style]} />
      
      {/* Main Content */}
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../assets/images/friend_plums.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.logoShadow} />
        </Animated.View>

        <Animated.View style={[styles.brandContainer, brandStyle]}>
          <View style={styles.titleWrapper}>
            <Text style={styles.mainTitleText}>Plums</Text>
          </View>
          
          <View style={styles.sloganWrapper}>
            <View style={styles.line} />
            <Text style={styles.sloganText}>Sweet bond, sweet friendship</Text>
            <View style={styles.line} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {loading && <ActivityIndicator size="small" color="#FF2D55" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
  orb1: {
    position: 'absolute',
    top: height * 0.1,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.1,
    left: -width * 0.3,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  logoShadow: {
    position: 'absolute',
    bottom: 20,
    width: '60%',
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    transform: [{ scaleX: 1.5 }],
  },
  brandContainer: {
    alignItems: 'center',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitleText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  sloganWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 15,
  },
  line: {
    height: 1,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sloganText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
