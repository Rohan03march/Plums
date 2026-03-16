import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserPresence, getAvatarSource, subscribeToCreatorCallHistory, CallRecord } from '../../services/firebaseService';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Protect Privacy', desc: 'Never share personal addresses.', icon: 'shield-checkmark' as const },
  { id: '2', title: 'Set Boundaries', desc: 'You are in control of the call always.', icon: 'hand-left' as const },
  { id: '3', title: 'Report Users', desc: 'Block abusive callers immediately.', icon: 'warning' as const },
];

export default function WomenHome() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { appUser, user, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    // Data is synced via listener, so we just add a delay for feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    // Presence is handled by root layout or specific events
    // But we keep this effect if needed for other initial syncs
  }, [loading, user]);

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
      <LinearGradient
        colors={['rgba(255, 77, 103, 0.05)', 'transparent', 'rgba(156, 39, 176, 0.05)']}
        style={StyleSheet.absoluteFill}
      />
      
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
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={getAvatarSource(appUser?.avatar, 'woman')} 
              style={styles.avatar} 
              contentFit="cover"
              transition={200}
            />
            <View style={styles.activeBadge} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.subText }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{appUser?.displayName?.split(' ')[0] || 'Creator'} ✨</Text>
          </View>
          <TouchableOpacity 
            style={styles.withdrawSurface} 
            onPress={() => router.push('/(women)/withdrawal')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.withdrawBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.withdrawText}>Withdraw</Text>
              <Ionicons name="arrow-forward" size={16} color="#0f0f13" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Online Status Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Broadcast Status</Text>
          <View style={styles.togglesContainer}>
            {/* Audio Toggle */}
            <View style={[styles.toggleCard, { backgroundColor: isAudioOnline ? 'rgba(255, 77, 103, 0.1)' : colors.card, borderColor: isAudioOnline ? '#FF4D67' : 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.toggleHeader}>
                <View style={[styles.iconBox, { backgroundColor: isAudioOnline ? '#FF4D67' : 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="mic" size={20} color={isAudioOnline ? '#fff' : '#a0a0a0'} />
                </View>
                <Switch
                  trackColor={{ false: '#333', true: 'rgba(255, 77, 103, 0.5)' }}
                  thumbColor={isAudioOnline ? '#FF4D67' : '#f4f3f4'}
                  onValueChange={handleAudioToggle}
                  value={isAudioOnline}
                />
              </View>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Audio Calls</Text>
              <Text style={[styles.toggleSub, { color: isAudioOnline ? '#FF4D67' : colors.subText }]}>{isAudioOnline ? 'Active' : 'Inactive'}</Text>
            </View>

            {/* Video Toggle */}
            <View style={[styles.toggleCard, { backgroundColor: isVideoOnline ? 'rgba(156, 39, 176, 0.1)' : colors.card, borderColor: isVideoOnline ? '#9C27B0' : 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.toggleHeader}>
                <View style={[styles.iconBox, { backgroundColor: isVideoOnline ? '#9C27B0' : 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="videocam" size={20} color={isVideoOnline ? '#fff' : '#a0a0a0'} />
                </View>
                <Switch
                  trackColor={{ false: '#333', true: 'rgba(156, 39, 176, 0.5)' }}
                  thumbColor={isVideoOnline ? '#9C27B0' : '#f4f3f4'}
                  onValueChange={handleVideoToggle}
                  value={isVideoOnline}
                />
              </View>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Video Calls</Text>
              <Text style={[styles.toggleSub, { color: isVideoOnline ? '#9C27B0' : colors.subText }]}>{isVideoOnline ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>

        {/* Today's Earnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Report</Text>
            <View style={styles.allTimeBadge}>
              <Text style={styles.allTimeText}>Lifetime: {appUser?.allTimeEarnings?.toLocaleString() || '0'}</Text>
            </View>
          </View>
          
          <LinearGradient 
            colors={['#1E1E24', '#15151A']} 
            style={[styles.reportCard, { borderColor: 'rgba(255,255,255,0.05)' }]}
          >
            <View style={styles.totalEarnedRow}>
              <View style={styles.coinIconBox}>
                <FontAwesome5 name="coins" size={24} color="#FFD700" />
              </View>
              <View>
                <Text style={[styles.totalEarnedText, { color: colors.text }]}>{appUser?.coins?.toLocaleString() || '0'}</Text>
                <Text style={styles.totalEarnedSub}>Available Wallet Balance</Text>
              </View>
            </View>

            <View style={styles.earningsGrid}>
              <View style={styles.earnItem}>
                <Text style={styles.earnLabel}>Video</Text>
                <Text style={styles.earnValue}>{appUser?.videoEarnings?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.earnDivider} />
              <View style={styles.earnItem}>
                <Text style={styles.earnLabel}>Audio</Text>
                <Text style={styles.earnValue}>{appUser?.audioEarnings?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.earnDivider} />
              <View style={styles.earnItem}>
                <Text style={styles.earnLabel}>Gifts</Text>
                <Text style={styles.earnValue}>{appUser?.giftEarnings?.toLocaleString() || '0'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                <Ionicons name="star" size={18} color="#FFD700" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{appUser?.rating?.toFixed(1) || appUser?.avgRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <TouchableOpacity 
              style={[styles.statBox, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(women)/call-history')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="call" size={18} color="#4CAF50" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{appUser?.totalCalls || '0'}</Text>
              <Text style={styles.statLabel}>Total Calls</Text>
            </TouchableOpacity>
            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                <Ionicons name="time" size={18} color="#2196F3" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{appUser?.talkTime || '0'}m</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </View>


        {/* Tips / Safety */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={SAFETY_TIPS}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.85 + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 20 }}
            renderItem={({ item }) => (
              <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                style={styles.carouselCard}
              >
                <View style={styles.tipIconBox}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.carouselText}>
                  <Text style={[styles.carouselTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.carouselDesc, { color: colors.subText }]}>{item.desc}</Text>
                </View>
              </LinearGradient>
            )}
          />
        </View>

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
    paddingBottom: 110,
    paddingTop: 60,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0f0f13',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  withdrawSurface: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  withdrawText: {
    color: '#0f0f13',
    fontWeight: '800',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  allTimeBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allTimeText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '700',
  },
  togglesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportCard: {
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  totalEarnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  coinIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  totalEarnedText: {
    fontSize: 36,
    fontWeight: '900',
  },
  totalEarnedSub: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  earningsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
  },
  earnItem: {
    flex: 1,
    alignItems: 'center',
  },
  earnLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  earnValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  earnDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    fontWeight: '600',
  },
  carouselContainer: {
    marginTop: 8,
  },
  carouselCard: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tipIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselText: {
    flex: 1,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  carouselDesc: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 15,
  },
  recentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  recentTime: {
    fontSize: 13,
    opacity: 0.7,
  },
  recentCost: {
    fontSize: 14,
    fontWeight: '800',
  }
});
