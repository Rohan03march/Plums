import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, RefreshControl, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarSource } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, toggleTheme, isDark } = useTheme();
  const { appUser, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Ready to take a break from Plums?",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error("Logout error:", error);
            }
          }
        }
      ]
    );
  };

  const ActionItem = ({ icon, title, color = '#6366f1', onPress, rightElement = null, isLast = false, subtitle = null }: any) => (
    <TouchableOpacity
      style={[styles.actionItem, !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: color === '#FF4D67' ? color : colors.text }]}>{title}</Text>
        {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Ionicons name="chevron-forward" size={18} color={isDark ? '#444' : '#ccc'} />}
    </TouchableOpacity>
  );

  const stats = useMemo(() => [
    { label: 'Rating', value: appUser?.rating?.toFixed(1) || '0.0', icon: 'star', color: '#FFD700' },
    { label: 'Gifts', value: appUser?.giftEarnings || '0', icon: 'gift', color: '#FF4D67' },
    { label: 'Total Calls', value: appUser?.totalCalls || '0', icon: 'call', color: '#4CAF50' },
    { label: 'Talk Time', value: `${appUser?.talkTime || '0'}m`, icon: 'time', color: '#2196F3' },
  ], [appUser]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Header Card */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.headerTop}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarGlow, { shadowColor: colors.primary }]} />
              <Image
                source={getAvatarSource(appUser?.avatar, 'woman')}
                style={[styles.avatar, { borderColor: colors.card }]}
              />
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#fff" />
              </View>
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{appUser?.displayName || 'Creator'}</Text>
              <Text style={[styles.username, { color: colors.subText }]}>@{appUser?.username || 'user'}</Text>
            </View>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name={stat.icon as any} size={12} color={stat.color} />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Action Group: Growth & Finance */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionHeading, { color: colors.subText }]}>REVENUE & GROWTH</Text>
          <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActionItem
              icon="wallet"
              title="Wallet & Payouts"
              subtitle={(() => {
                const totalEarned = (appUser?.audioEarnings || 0) + (appUser?.videoEarnings || 0) + (appUser?.giftEarnings || 0);
                const factor = totalEarned > 0 ? Math.min(1, (appUser?.coins || 0) / totalEarned) : 0;
                const rupeeVal = (
                  ((appUser?.audioEarnings || 0) * factor * 0.14) +
                  ((appUser?.videoEarnings || 0) * factor * 0.10) +
                  ((appUser?.giftEarnings || 0) * factor * 0.10)
                );
                return `Current Balance: ₹${rupeeVal.toFixed(2)}`;
              })()}
              color="#FF4D67"
              onPress={() => router.push('/(women)/withdrawal')}
            />
            <ActionItem
              icon="receipt"
              title="Transaction History"
              color="#10B981"
              onPress={() => router.push('/(women)/tx-history')}
            />
          </View>
        </Animated.View>

        {/* Action Group: Preferences */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionHeading, { color: colors.subText }]}>PREFERENCES</Text>
          <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActionItem
              icon={isDark ? "moon" : "sunny"}
              title="Appearance"
              subtitle={isDark ? "Dark Modern Theme" : "Light Elegant Theme"}
              color="#F59E0B"
              onPress={() => toggleTheme()}
              rightElement={
                <View style={[styles.themePill, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <Text style={[styles.themePillText, { color: colors.text }]}>{isDark ? 'Dark' : 'Light'}</Text>
                </View>
              }
            />
            <ActionItem
              icon="notifications"
              title="Notifications"
              color="#3B82F6"
              onPress={() => { }}
              isLast={true}
            />
          </View>
        </Animated.View>

        {/* Action Group: Support */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionHeading, { color: colors.subText }]}>APP SUPPORT</Text>
          <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActionItem icon="help-buoy" title="Help & Support" color="#EC4899" onPress={() => router.push('/support')} />
            <ActionItem icon="shield-checkmark" title="Privacy Policy" color="#10B981" onPress={() => router.push('/privacy')} />
            <ActionItem icon="document-text" title="Terms of Service" color="#6366f1" onPress={() => router.push('/terms')} isLast={true} />
          </View>
        </Animated.View>

        {/* Logout Section */}
        <AnimatedTouchableOpacity
          entering={FadeInDown.delay(800).duration(800).springify()}
          activeOpacity={0.7}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: isDark ? 'rgba(255, 77, 103, 0.2)' : 'rgba(255, 77, 103, 0.1)' }]}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4D67" />
          <Text style={styles.logoutText}>Sign Out of Plums</Text>
        </AnimatedTouchableOpacity>

        <Text style={styles.versionText}>Plums Creator v1.0.4 • Made with ✨</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    color: '#FF4D67',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(160,160,160,0.1)',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 8,
    letterSpacing: 1,
  },
  actionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
    fontWeight: '500',
  },
  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: '#FF4D67',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  }
});
