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
  Easing,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.82);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(18);
  const sloganOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo fades in faster
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    logoScale.value = withSpring(1, { damping: 15, stiffness: 60 });

    // Title slides up much sooner
    titleOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    titleY.value = withDelay(150, withSpring(0, { damping: 18, stiffness: 60 }));

    // Slogan follows immediately
    sloganOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

    // Footer last
    footerOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
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
          router.replace(hasSeenOnboarding === 'true' ? '/login' : '/onboarding');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, appUser]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#12071A', '#0C0C14', '#130B1A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Subtle top-right accent */}
      <View style={styles.accentTopRight} />
      {/* Subtle bottom-left accent */}
      <View style={styles.accentBottomLeft} />

      <View style={styles.body}>
        {/* Logo section */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            source={require('../assets/images/friend_plums.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        {/* Text section */}
        <Animated.View style={[styles.titleRow, titleStyle]}>
          <Text style={styles.title}>Plums</Text>
        </Animated.View>

        <Animated.View style={[styles.sloganRow, sloganStyle]}>
          <View style={styles.sloganLine} />
          <Text style={styles.slogan}>Sweet bond · Sweet friendship</Text>
          <View style={styles.sloganLine} />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, footerStyle]}>
        <ActivityIndicator size="small" color="rgba(255,45,85,0.7)" />
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = width * 0.68;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C0C14',
  },
  accentTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(180, 40, 80, 0.07)',
  },
  accentBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(100, 30, 160, 0.06)',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 32,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 54,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#FFE4EC',
    letterSpacing: 4,
    includeFontPadding: false,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  sloganLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  slogan: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
