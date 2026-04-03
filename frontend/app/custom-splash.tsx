import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomSplashScreen from '../components/CustomSplashScreen';

export default function CustomSplashScreenPage() {
  const router = useRouter();
  const { user, appUser, loading } = useAuth();

  useEffect(() => {
    // We wait for auth to finish loading before starting the timer,
    // even though we don't show a loader, to ensure we know where to redirect.
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

  return <CustomSplashScreen />;
}
