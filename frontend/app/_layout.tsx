import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import IncomingCallModal from '../components/IncomingCallModal';
import { subscribeToIncomingCalls, updateCallSession, CallSession } from '../services/firebaseService';
import { useRouter } from 'expo-router';
import { CallProvider, useCall } from '../context/CallContext';
import FloatingCallPreview from '../components/FloatingCallPreview';
import RatingModal from '../components/RatingModal';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppView({ onLayoutRootView }: { onLayoutRootView: () => Promise<void> }) {
  const { isDark, colors } = useTheme();
  const { appUser, user } = useAuth();
  const { startCall } = useCall();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const handledCallIds = useRef<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (user && appUser?.role === 'woman') {
      const unsubscribe = subscribeToIncomingCalls(user.uid, (call) => {
        if (call && handledCallIds.current.has(call.id)) {
          setIncomingCall(null);
          return;
        }
        setIncomingCall(call);
      });
      return () => unsubscribe();
    }
  }, [user, appUser]);

  const handleAccept = async () => {
    if (incomingCall) {
      const sessionId = incomingCall.id;
      const type = incomingCall.type;

      // Prevent UI flickering by marking this ID as handled
      handledCallIds.current.add(sessionId);
      setIncomingCall(null);

      await updateCallSession(sessionId, 'accepted');
      await startCall(sessionId, 'receiver', type);
      router.push({ pathname: '/call/[id]', params: { id: sessionId, role: 'receiver', type } });
    }
  };

  const handleReject = async () => {
    if (incomingCall) {
      const sessionId = incomingCall.id;
      handledCallIds.current.add(sessionId);
      setIncomingCall(null);
      await updateCallSession(sessionId, 'rejected');
    }
  };

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" options={{ title: 'Onboarding' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="role" options={{ headerShown: false }} />
        <Stack.Screen name="setup-women" options={{ title: 'Profile Setup' }} />
        <Stack.Screen name="(men)" options={{ title: 'Men App' }} />
        <Stack.Screen name="(women)" options={{ title: 'Women App' }} />
        <Stack.Screen name="call/[id]" options={{ title: 'Call Room' }} />
      </Stack>

      <IncomingCallModal
        visible={!!incomingCall}
        session={incomingCall}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <FloatingCallPreview />

      <RatingModal />
    </View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const imagesToCache = [
          require('../assets/images/onboarding_1.jpg'),
          require('../assets/images/onboarding_2.jpg'),
          require('../assets/images/onboarding_3.jpg'),
          require('../assets/images/3d_avatar_1.jpg'),
          require('../assets/images/3d_avatar_2.jpg'),
          require('../assets/images/3d_avatar_3.jpg'),
          require('../assets/images/3d_avatar_4.jpg'),
          require('../assets/images/3d_boy_1.jpg'),
          require('../assets/images/3d_boy_2.jpg'),
          require('../assets/images/3d_boy_3.jpg'),
          require('../assets/images/3d_boy_4.jpg'),
          require('../assets/images/friend_plums.jpg'),
        ];

        const cacheImages = imagesToCache.map(image => {
          return Asset.fromModule(image).downloadAsync();
        });

        await Promise.all(cacheImages);
      } catch (e) {
        console.warn('Error preloading images:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <CallProvider>
              <AppView onLayoutRootView={onLayoutRootView} />
            </CallProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

