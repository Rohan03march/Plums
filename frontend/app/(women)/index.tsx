import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Platform, ActivityIndicator, FlatList } from 'react-native';
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
import { updateUserPresence, getAvatarSource, migrateUserRupeeBalance, subscribeToPendingPayout, moveTodayEarningsToBalance, subscribeToEarningsBreakdown } from '../../services/firebaseService';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Privacy First', desc: 'Secure your personal details and location.', icon: 'person-circle' as const },
  { id: '2', title: 'Stay Empowered', desc: 'You control every interaction and call.', icon: 'accessibility' as const },
  { id: '3', title: 'Abuse Protocol', desc: 'One-tap block for disrespectful users.', icon: 'person-remove' as const },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function WomenHome() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { appUser, user, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCoins, setPendingCoins] = useState(0);


  // Period Selection States
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'lifetime'>('today');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [periodEarnings, setPeriodEarnings] = useState<number>(0);
  const [periodBreakdown, setPeriodBreakdown] = useState({ audio: 0, video: 0, gift: 0 });

  // Safety Carousel States
  const flatListRef = useRef<FlatList>(null);
  const [safetyIndex, setSafetyIndex] = useState(0);

  // Auto-scroll Security Guide
  useEffect(() => {
    if (SAFETY_TIPS.length <= 1) return;

    const timer = setInterval(() => {
      setSafetyIndex((prev) => {
        const next = (prev + 1) % SAFETY_TIPS.length;
        flatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

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
    const unsubscribePayout = subscribeToPendingPayout(user.uid, (coins) => {
      setPendingCoins(coins);
    });


    // 24-hour reset logic for today's earnings
    const checkAndResetEarnings = async () => {
      if (appUser && appUser.role === 'woman') {
        const lastReset = appUser.lastResetTime || 0;
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - lastReset >= twentyFourHours) {
          await moveTodayEarningsToBalance(appUser.id, appUser.todayEarnings || 0);
        }
      }
    };
    checkAndResetEarnings();

    // 3. Balance Sync and Migration (Robust for Withdrawals)
    const syncBalance = async () => {
      if (appUser && appUser.role === 'woman') {
        const goldBalance = appUser.earningBalance || 0;
        const currentRupee = appUser.rupeeBalance;

        // If rupeeBalance is missing but they have gold, or if it's 0 but they have lots of gold
        if (currentRupee === undefined || (currentRupee === 0 && goldBalance > 0)) {
          console.log("[Sync] Triggering balance migration for creator", appUser.id);
          await migrateUserRupeeBalance(appUser.id, goldBalance);
        }
      }
    };
    syncBalance();

    return () => unsubscribePayout();
  }, [loading, user, appUser?.id]);


  // Real-time Earnings Subscription
  useEffect(() => {
    if (!appUser || appUser.role !== 'woman') return;

    // Subscribe to earnings breakdown for the selected period
    const unsubscribeEarnings = subscribeToEarningsBreakdown(appUser.id, selectedPeriod, (breakdown) => {
      setPeriodEarnings(breakdown.total);
      setPeriodBreakdown({
        audio: breakdown.audio,
        video: breakdown.video,
        gift: breakdown.gift
      });
    });

    return () => unsubscribeEarnings();
  }, [appUser?.id, selectedPeriod]);


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
            onPress={() => router.push('/(women)/withdrawal')}
            style={[
              styles.coinBalanceBtn,
              { backgroundColor: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(255,215,0,0.15)' },
              pendingCoins > 0 && { opacity: 0.9 }
            ]}
          >
            <FontAwesome5 name="coins" size={14} color="#FFD700" />
            <Text style={[styles.coinBalanceText, { color: isDark ? '#FFD700' : '#D97706' }]}>
              {((appUser?.earningBalance || 0) + pendingCoins).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </Animated.View>


        {/* Premium Revenue Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={{ zIndex: 1000 }}>
          <LinearGradient
            colors={isDark ? ['#1E1E24', '#0f0f13'] : ['#ffffff', '#f8f9fa']}
            style={[styles.revenueCard, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <View style={styles.revHeaderContent}>
              <View style={styles.revHeaderLeft}>
                <View style={styles.periodTitleContainer}>
                  <Text style={[styles.revTitle, { letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.6 }]}>
                    {selectedPeriod === 'today' ? "Today" :
                      selectedPeriod === 'yesterday' ? "Yesterday" :
                        selectedPeriod === 'week' ? "Weekly" : "Lifetime"}
                  </Text>
                  <View style={styles.periodDot} />
                </View>

                <View style={styles.todayEarningMain}>
                  <View style={styles.coinGlowContainer}>
                    <FontAwesome5 name="coins" size={28} color="#FFD700" />
                  </View>
                  <Text style={[styles.revMainLarge, { color: colors.text }]}>
                    {pendingCoins > 0 ? '0' : (periodEarnings.toLocaleString() || '0')}
                  </Text>
                  <Text style={styles.goldTextLabel}></Text>
                </View>
              </View>

              {/* Period Selector Button */}
              <View style={styles.periodSelectorWrapper}>
                <TouchableOpacity
                  onPress={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  style={[styles.periodBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                >
                  <Text style={[styles.periodBtnText, { color: colors.subText }]}>
                    {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
                  </Text>
                  <Ionicons name={isPeriodDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.subText} />
                </TouchableOpacity>

                {isPeriodDropdownOpen && (
                  <Animated.View
                    entering={FadeInRight.duration(200)}
                    style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'week', label: 'Weekly' },
                      { id: 'lifetime', label: 'Lifetime' }
                    ].map((period) => (
                      <TouchableOpacity
                        key={period.id}
                        onPress={() => {
                          setSelectedPeriod(period.id as any);
                          setIsPeriodDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          selectedPeriod === period.id && { backgroundColor: colors.primary + '10' }
                        ]}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          { color: selectedPeriod === period.id ? colors.primary : colors.text }
                        ]}>
                          {period.label}
                        </Text>
                        {selectedPeriod === period.id && (
                          <Ionicons name="checkmark" size={14} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </View>
            </View>

            {pendingCoins > 0 && (
              <View style={styles.payoutNotice}>
                <Ionicons name="information-circle" size={14} color="#FFD700" />
                <Text style={styles.payoutNoticeText}>
                  Your previous request is being pending.
                </Text>
              </View>
            )}

            <View style={styles.earningsGrid}>
              {(() => {
                const categories = [
                  { label: 'Audio', icon: 'mic', coins: pendingCoins > 0 ? 0 : periodBreakdown.audio, rupees: pendingCoins > 0 ? 0 : periodBreakdown.audio * 0.14, color: '#FF4D67', bg: 'rgba(255, 77, 103, 0.05)' },
                  { label: 'Video', icon: 'videocam', coins: pendingCoins > 0 ? 0 : periodBreakdown.video, rupees: pendingCoins > 0 ? 0 : periodBreakdown.video * 0.10, color: '#8E44AD', bg: 'rgba(142, 68, 173, 0.05)' },
                  { label: 'Gifts', icon: 'gift', coins: pendingCoins > 0 ? 0 : periodBreakdown.gift, rupees: pendingCoins > 0 ? 0 : periodBreakdown.gift * 0.10, color: '#F39C12', bg: 'rgba(243, 156, 18, 0.05)' }
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

        {/* Live Status Control - Glassmorphism style */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.controlCenter}
        >
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



        {/* Safety Carousel */}
        <Animated.View
          entering={FadeInDown.delay(900).duration(800)}
          style={styles.safetyArea}
        >
          <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 16, paddingHorizontal: 20 }]}>Security Guide</Text>
          <FlatList
            ref={flatListRef}
            data={SAFETY_TIPS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: any) => item.id}
            onMomentumScrollEnd={(e: any) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / (width - 40));
              setSafetyIndex(index);
            }}
            renderItem={({ item: tip }: { item: any }) => (
              <View style={{ width: width - 40, paddingHorizontal: 0 }}>
                <LinearGradient
                  colors={isDark ? ['#1e1e24', '#25252d'] : ['#ffffff', '#f0f0f5']}
                  style={styles.tipCard}
                >
                  <View style={styles.tipIconWrap}>
                    <Ionicons name={tip.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[styles.tipDesc, { color: colors.subText }]}>{tip.desc}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          />
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
  coinBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinBalanceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  revHeaderLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 15,
    flex: 1,
  },
  revHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  periodSelectorWrapper: {
    position: 'relative',
    marginTop: 5,
  },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(160,160,160,0.1)',
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  periodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    gap: 8,
  },
  periodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D67',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  todayEarningMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  coinGlowContainer: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  revMainLarge: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  goldTextLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    marginTop: 12,
    letterSpacing: 1,
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
    marginBottom: 3,
  },
  revMain: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    paddingHorizontal: 0,
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: '900',
  },
  earningValueCoins: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
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
    width: '100%',
    padding: 20,
    borderRadius: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(160,160,160,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 18,
  }
});

