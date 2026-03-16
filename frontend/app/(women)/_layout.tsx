import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function WomenLayout() {
  const { colors } = useTheme();
  return (
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
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderTopWidth: 1,
        borderColor: colors.border,
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
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
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pods"
        options={{
          headerTitle: 'Voice Pods',
          title: 'Pods',
          tabBarIcon: ({ color }) => <Ionicons name="headset" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: 'My Profile',
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withdrawal"
        options={{
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
  );
}
