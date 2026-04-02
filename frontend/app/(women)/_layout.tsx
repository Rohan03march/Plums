import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import * as React from 'react';

export default function WomenLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Memoize the entire Navigator to prevent double-registration for linking in React Navigation 7
  const TabNavigator = React.useMemo(() => (
    <Tabs screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: colors.bg, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '800', fontSize: 24 },
      tabBarStyle: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        borderColor: colors.border,
        height: Platform.OS === 'android' ? 64 + Math.max(insets.bottom, 16) : 70 + insets.bottom,
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) - 4 : insets.bottom + 10,
        paddingTop: 12,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.subText,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          headerTitle: 'Dashboard',
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pods"
        options={{
          headerTitle: 'Voice Pods',
          title: 'Pods',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="headset" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: 'My Profile',
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="person-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withdrawal"
        options={{
          headerShown: false,
          headerTitle: 'Withdraw Earnings',
          href: null, // this hides it from the bottom tab bar
        }}
      />
      <Tabs.Screen
        name="tx-history"
        options={{
          headerShown: false,
          headerTitle: 'Payout History',
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />
      <Tabs.Screen
        name="call-history"
        options={{
          headerShown: false,
          headerTitle: 'Call History',
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />
    </Tabs>
  ), [colors, insets.bottom]);

  return TabNavigator;
}
