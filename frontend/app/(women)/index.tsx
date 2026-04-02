import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserPresence, getAvatarSource, migrateUserRupeeBalance, subscribeToPendingPayout } from '../../services/firebaseService';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Privacy First', desc: 'Secure your personal details and location.', icon: 'shield-checkmark' as const },
  { id: '2', title: 'Stay Empowered', desc: 'You control every interaction and call.', icon: 'hand-left' as const },
  { id: '3', title: 'Abuse Protocol', desc: 'One-tap block for disrespectful users.', icon: 'warning' as const },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function WomenHome() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { appUser, user, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isPayoutPending, setIsPayoutPending] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (appUser && appUser.role === 'woman' && appUser.rupeeBalance === undefined) {
      migrateUserRupeeBalance(appUser.id, appUser.coins || 0);
    }

    // Payout pending listener
    const unsubscribePayout = subscribeToPendingPayout(user.uid, (pending) => {
      setIsPayoutPending(pending);
    });

    return () => unsubscribePayout();
  }, [loading, user, appUser]);

  const handleAudioToggle = async (value: boolean) => {
    if (!user) return;
    await updateUserPresence(user.uid, {
      isAudioOnline: value,
      isOnline: value || isVideoOnline
    });
  };

  const handleVideoToggle = async (value: boolean) => {
    if (!user) return;
    await updateUserPresence(user.uid, {
      isVideoOnline: value,
      isOnline: value || isAudioOnline
    });
  };

  const isAudioOnline = appUser?.isAudioOnline || false;
  const isVideoOnline = appUser?.isVideoOnline || false;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Dynamic Background Gradients */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[isDark ? '#1a0b1a' : '#fff0f3', colors.bg]}
          style={{ height: 300 }}
        />
        <LinearGradient
          colors={['transparent', isDark ? 'rgba(255, 77, 103, 0.03)' : 'rgba(255, 77, 103, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify()}
          style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.headerInfo}>
            <View style={styles.avatarWrapper}>
              <Image
                source={getAvatarSource(appUser?.avatar, 'woman')}
                style={styles.avatarImg}
                contentFit="cover"
                transition={400}
              />
              <View style={[styles.onlineDot, { backgroundColor: (isAudioOnline || isVideoOnline) ? '#4CAF50' : '#FF9800' }]} />
            </View>
            <View style={styles.userMeta}>
              <Text style={[styles.welcome, { color: colors.subText }]}>Good day,</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{appUser?.displayName?.split(' ')[0] || 'Creator'} ✨</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(women)/profile')}
            style={[styles.settingsBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="settings-sharp" size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Live Status Control - Glassmorphism style */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.controlCenter}
        >
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Broadcasting Control</Text>
          <View style={styles.statusRow}>
            {/* Audio Service */}
            <View style={[styles.statusCard, { backgroundColor: isAudioOnline ? 'rgba(255, 77, 103, 0.12)' : colors.card, borderColor: isAudioOnline ? colors.primary : colors.border }]}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusIcon, { backgroundColor: isAudioOnline ? colors.primary : 'rgba(160,160,160,0.1)' }]}>
                  <Ionicons name="mic" size={22} color={isAudioOnline ? '#fff' : colors.subText} />
                </View>
                <Switch
                  trackColor={{ false: '#333', true: 'rgba(255, 77, 103, 0.4)' }}
                  thumbColor={isAudioOnline ? colors.primary : '#f4f3f4'}
                  onValueChange={handleAudioToggle}
                  value={isAudioOnline}
                />
              </View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>Voice Calls</Text>
              <Text style={[styles.statusSub, { color: isAudioOnline ? colors.primary : colors.subText }]}>{isAudioOnline ? 'Waitng for calls...' : 'Offline'}</Text>
              {isAudioOnline && (
                <View style={styles.ratesWrapper}>
                  <View style={[styles.miniRate, { 
                    backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(245, 158, 11, 0.1)', 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 4,
                    borderColor: isDark ? 'transparent' : 'rgba(245, 158, 11, 0.2)',
                    borderWidth: isDark ? 0 : 1
                  }]}>
                    <FontAwesome5 name="coins" size={8} color={isDark ? '#FFD700' : '#D97706'} />
                    <Text style={[styles.miniRateText, { color: isDark ? '#FFD700' : '#D97706' }]}>10/min</Text>
                  </View>
                  <View style={styles.miniRate}>
                    <Text style={styles.miniRateText}>₹1.4/m</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Video Service */}
            <View style={[styles.statusCard, { backgroundColor: isVideoOnline ? 'rgba(156, 39, 176, 0.12)' : colors.card, borderColor: isVideoOnline ? '#9C27B0' : colors.border }]}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusIcon, { backgroundColor: isVideoOnline ? '#9C27B0' : 'rgba(160,160,160,0.1)' }]}>
                  <Ionicons name="videocam" size={22} color={isVideoOnline ? '#fff' : colors.subText} />
                </View>
                <Switch
                  trackColor={{ false: '#333', true: 'rgba(156, 39, 176, 0.4)' }}
                  thumbColor={isVideoOnline ? '#9C27B0' : '#f4f3f4'}
                  onValueChange={handleVideoToggle}
                  value={isVideoOnline}
                />
              </View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>Video Calls</Text>
              <Text style={[styles.statusSub, { color: isVideoOnline ? '#9C27B0' : colors.subText }]}>{isVideoOnline ? 'Live on Feed' : 'Offline'}</Text>
              {isVideoOnline && (
                <View style={styles.ratesWrapper}>
                  <View style={[styles.miniRate, { 
                    backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(245, 158, 11, 0.1)', 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 4,
                    borderColor: isDark ? 'transparent' : 'rgba(245, 158, 11, 0.2)',
                    borderWidth: isDark ? 0 : 1
                  }]}>
                    <FontAwesome5 name="coins" size={8} color={isDark ? '#FFD700' : '#D97706'} />
                    <Text style={[styles.miniRateText, { color: isDark ? '#FFD700' : '#D97706' }]}>60/min</Text>
                  </View>
                  <View style={[styles.miniRate, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
                    <Text style={[styles.miniRateText, { color: '#E040FB' }]}>₹6.0/m</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Premium Revenue Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
          <LinearGradient
            colors={isDark ? ['#1E1E24', '#0f0f13'] : ['#ffffff', '#f8f9fa']}
            style={[styles.revenueCard, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <View style={styles.revHeader}>
              <View>
                <Text style={styles.revTitle}>Total Revenue</Text>
                {(() => {
                  const totalEarned = (appUser?.audioEarnings || 0) + (appUser?.videoEarnings || 0) + (appUser?.giftEarnings || 0);
                  const factor = totalEarned > 0 ? Math.min(1, (appUser?.coins || 0) / totalEarned) : 0;
                  const audioINR = (appUser?.audioEarnings || 0) * factor * 0.14;
                  const videoINR = (appUser?.videoEarnings || 0) * factor * 0.10;
                  const giftINR = (appUser?.giftEarnings || 0) * factor * 0.10;
                  return (
                    <Text style={[styles.revMain, { color: colors.text }]}>₹{(audioINR + videoINR + giftINR).toFixed(2)}</Text>
                  );
                })()}
              </View>
              <TouchableOpacity 
                style={[styles.withdrawAction, isPayoutPending && { opacity: 0.5 }]}
                onPress={() => !isPayoutPending && router.push('/(women)/withdrawal')}
                disabled={isPayoutPending}
              >
                <LinearGradient
                  colors={isPayoutPending ? ['#8E8E93', '#AEAEB2'] : ['#FF4D67', '#FF7E8D']}
                  style={styles.withdrawBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.withdrawBtnLabel}>
                    {isPayoutPending ? 'Processing' : 'Withdraw'}
                  </Text>
                  <Ionicons 
                    name={isPayoutPending ? "time-outline" : "chevron-forward"} 
                    size={16} 
                    color="#fff" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {isPayoutPending && (
              <View style={styles.payoutNotice}>
                <Ionicons name="information-circle" size={14} color="#FFD700" />
                <Text style={styles.payoutNoticeText}>
                  Your previous request is being finalized.
                </Text>
              </View>
            )}

            <View style={styles.revDivider} />

            <View style={styles.revStats}>
              <View style={styles.revItem}>
                <View style={[styles.coinCircle, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                  <FontAwesome5 name="coins" size={12} color="#FFD700" />
                </View>
                <View>
                  <Text style={styles.revItemLabel}>Balance</Text>
                  <Text style={[styles.revItemValue, { color: colors.text }]}>{appUser?.coins?.toLocaleString() || '0'}</Text>
                </View>
              </View>
              <View style={styles.revItem}>
                <View style={[styles.coinCircle, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Ionicons name="trending-up" size={14} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.revItemLabel}>Lifetime</Text>
                  <Text style={[styles.revItemValue, { color: colors.text }]}>₹{(appUser?.allTimeEarnings || 0).toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.earningsGrid}>
              {(() => {
                const totalEarned = (appUser?.audioEarnings || 0) + (appUser?.videoEarnings || 0) + (appUser?.giftEarnings || 0);
                const factor = totalEarned > 0 ? Math.min(1, (appUser?.coins || 0) / totalEarned) : 0;
                
                const categories = [
                  { 
                    label: 'Audio', 
                    icon: 'mic', 
                    coins: appUser?.audioEarnings || 0, 
                    rupees: (appUser?.audioEarnings || 0) * factor * 0.14,
                    color: '#FF4D67',
                    bg: 'rgba(255, 77, 103, 0.08)'
                  },
                  { 
                    label: 'Video', 
                    icon: 'videocam', 
                    coins: appUser?.videoEarnings || 0, 
                    rupees: (appUser?.videoEarnings || 0) * factor * 0.10,
                    color: '#8E44AD',
                    bg: 'rgba(142, 68, 173, 0.08)'
                  },
                  { 
                    label: 'Gifts', 
                    icon: 'gift', 
                    coins: appUser?.giftEarnings || 0, 
                    rupees: (appUser?.giftEarnings || 0) * factor * 0.10,
                    color: '#F39C12',
                    bg: 'rgba(243, 156, 18, 0.08)'
                  }
                ];

                return categories.map((cat, idx) => (
                  <View key={idx} style={[styles.earningCard, { backgroundColor: cat.bg }]}>
                    <View style={styles.earningHeader}>
                      <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                      <Text style={[styles.earningLabel, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                    <Text style={[styles.earningValueINR, { color: colors.text }]}>₹{cat.rupees.toFixed(2)}</Text>
                    <Text style={styles.earningValueCoins}>{cat.coins.toLocaleString()} Gold</Text>
                  </View>
                ));
              })()}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Analytics Grid */}
        <View style={styles.analyticsSection}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Performance Insights</Text>
          <View style={styles.analyticsGrid}>
            {[
              { label: 'Rating', value: appUser?.rating?.toFixed(1) || '0.0', icon: 'star', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
              { label: 'Total Calls', value: appUser?.totalCalls || '0', icon: 'call', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)', route: '/(women)/call-history' },
              { label: 'Talk Time', value: `${appUser?.talkTime || '0'}m`, icon: 'time', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
            ].map((stat, i) => (
              <AnimatedTouchableOpacity
                key={stat.label}
                entering={FadeInRight.delay(600 + (i * 100)).duration(600).springify()}
                onPress={() => stat.route && router.push(stat.route as any)}
                activeOpacity={0.7}
                style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.analyticsIcon, { backgroundColor: stat.bg }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={[styles.analyticsValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={styles.analyticsLabel}>{stat.label}</Text>
              </AnimatedTouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety Carousel */}
        <Animated.View 
          entering={FadeInDown.delay(900).duration(800)}
          style={styles.safetyArea}
        >
          <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 12 }]}>Security Guide</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {SAFETY_TIPS.map((tip) => (
              <LinearGradient
                key={tip.id}
                colors={isDark ? ['#1e1e24', '#25252d'] : ['#ffffff', '#f0f0f5']}
                style={styles.tipCard}
              >
                <View style={styles.tipIconWrap}>
                   <Ionicons name={tip.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.tipText}>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                  <Text style={[styles.tipDesc, { color: colors.subText }]}>{tip.desc}</Text>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userMeta: {
    gap: 2,
  },
  welcome: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCenter: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    minHeight: 140,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratesWrapper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  miniRate: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 103, 0.2)',
  },
  miniRateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4D67',
  },
  revenueCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  revTitle: {
    color: '#a0a0a0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  revMain: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  withdrawAction: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  withdrawBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  withdrawBtnLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  revDivider: {
    height: 1,
    backgroundColor: 'rgba(160,160,160,0.1)',
    marginBottom: 20,
  },
  revStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payoutNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  payoutNoticeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  revItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revItemLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    fontWeight: '600',
  },
  revItemValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(160,160,160,0.05)',
  },
  earningCard: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'flex-start',
  },
  earningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  earningLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningValueINR: {
    fontSize: 13,
    fontWeight: '800',
  },
  earningValueCoins: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 1,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  analyticsLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    fontWeight: '600',
  },
  safetyArea: {
    marginBottom: 20,
  },
  tipCard: {
    width: 200,
    padding: 16,
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(160,160,160,0.1)',
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    gap: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tipDesc: {
    fontSize: 11,
    lineHeight: 16,
  }
});

