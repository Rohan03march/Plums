import { Tabs, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import * as React from 'react';

export default function MenLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();

  const HeaderRight = () => {
    return (
      <TouchableOpacity
        style={styles.coinBadge}
        onPress={() => router.push('/(men)/wallet')}
        activeOpacity={0.8}
      >
        <FontAwesome5 
          name="coins" 
          size={16} 
          color="#FFD700" 
          style={{ marginRight: 6 }}
        />
        <Text style={styles.coinText}>{appUser?.coins ?? 120}</Text>
        <View style={styles.plusCircle}>
          <Ionicons name="add" size={14} color="#000" />
        </View>
      </TouchableOpacity>
    );
  };

  // Memoize the entire Navigator to prevent double-registration for linking in React Navigation 7
  const TabNavigator = React.useMemo(() => (
    <Tabs screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: colors.bg, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '800', fontSize: 24 },
      headerRight: () => <HeaderRight />,
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
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.subText,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: appUser?.displayName 
            ? `Hello, ${appUser.displayName.split(' ')[0]} ✨` 
            : 'Hello! ✨',
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="heart" size={28} color={color} />,
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
        name="wallet"
        options={{
          headerTitle: 'Gold Shop',
          href: null, // this hides it from the bottom tab bar
        }}
      />
      <Tabs.Screen
        name="call-history"
        options={{
          headerShown: false,
          headerTitle: 'Call History',
          href: null,
          tabBarStyle: { display: 'none' } // optionally hide footer on sub pages
        }}
      />
      <Tabs.Screen
        name="tx-history"
        options={{
          headerShown: false,
          headerTitle: 'Transactions',
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />
    </Tabs>
  ), [colors, insets.bottom, appUser?.displayName, appUser?.coins]);

  return TabNavigator;
}

const styles = StyleSheet.create({
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  coinText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 16,
  },
  plusCircle: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  }
});
