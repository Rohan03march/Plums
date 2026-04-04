import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Switch, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarSource, updateUserProfile } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
export { updateUserProfile };

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Kindness First', desc: 'Treat everyone with respect. Kindness makes for better connections.', icon: 'heart' as const },
  { id: '2', title: 'Secure Privacy', desc: 'Never share your phone number, financial details, or personal ID.', icon: 'shield-checkmark' as const },
  { id: '3', title: 'Zero Tolerance', desc: 'Block and report any inappropriate behavior. We take your safety seriously.', icon: 'warning' as const },
];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, colors: theme } = useTheme();
  const { appUser, user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data is synced via listener, so we just add a delay for feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
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

  const ActionItem = ({ icon, title, color = '#fff', onPress, rightText = null, isToggle = false, toggleValue = false, onToggle = null }: any) => (
    <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.card }]} onPress={onPress} activeOpacity={isToggle ? 1 : 0.7}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionTitle, { color: color === '#FF4D67' ? color : theme.text }]}>{title}</Text>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {isToggle ? (
        <Switch
          trackColor={{ false: '#d1d5db', true: 'rgba(255, 77, 103, 0.5)' }}
          thumbColor={toggleValue ? '#FF4D67' : '#f4f3f4'}
          onValueChange={onToggle}
          value={toggleValue}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.subText} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF4D67"
          colors={['#FF4D67']}
        />
      }
    >
      {/* Header Profile Area */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerInfoCover}>
          <View style={styles.headerTop}>
            <View style={styles.avatarWrapper}>
              <Image
                source={getAvatarSource(appUser?.avatar, 'man')}
                style={[styles.avatar, { borderColor: theme.border }]}
              />
              <View style={styles.membershipBadgeWrapper}>
                <Ionicons name="shield-checkmark" size={14} color="#FFD700" />
              </View>
            </View>
            <View style={styles.nameSection}>
              <View style={styles.levelRow}>
                <View style={[styles.statusBadge, { backgroundColor: (appUser?.coins ?? 0) > 50000 ? '#1a1a1a' : '#2a2a2a' }]}>
                  <Text style={[styles.statusText, { color: (appUser?.coins ?? 0) > 50000 ? '#FFD700' : '#E5E7EB' }]}>
                    {(appUser?.coins ?? 0) > 50000 ? 'PLATINUM VIP' : ((appUser?.coins ?? 0) > 10000 ? 'GOLD MEMBER' : 'SILVER MEMBER')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.name, { color: theme.text }]}>{appUser?.displayName || 'Executive User'}</Text>
              <Text style={[styles.username, { color: theme.subText }]}>@{appUser?.username || 'user'}</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{(appUser?.totalCalls || 0)}</Text>
              <Text style={styles.statLabel}>Calls Made</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{(appUser?.giftSent || 0)}</Text>
              <Text style={styles.statLabel}>Gifts Sent</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{(appUser?.talkTime || 0)}m</Text>
              <Text style={styles.statLabel}>Talk Time</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Gold Shop "Black Card" Banner */}
      <TouchableOpacity
        onPress={() => router.push('/(men)/wallet')}
        activeOpacity={0.85}
        style={styles.cardContainer}
      >
        <View style={[styles.goldCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardPattern}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardBrand}>PLUMS GOLD</Text>
                <Text style={styles.cardType}>PREMIUM BALANCE</Text>
              </View>
              <FontAwesome5 name="coins" size={24} color="#D4AF37" />
            </View>

            <View style={styles.cardMain}>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceValue}>{appUser?.coins?.toLocaleString() || 0}</Text>
                <Text style={styles.balanceUnit}>GOLD</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardHolder}>{appUser?.displayName?.toUpperCase() || 'USER'}</Text>
              <View style={styles.topUpBtn}>
                <Text style={styles.topUpText}>RECHARGE</Text>
                <Ionicons name="add-circle" size={16} color="#000" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Safety & Security Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={SAFETY_TIPS}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.75 + 15}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.delay(index * 200).duration(800).springify()}
              style={[styles.carouselCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.carouselIcon}>
                <Ionicons name={item.icon} size={20} color="#FF4D67" />
              </View>
              <View style={styles.carouselText}>
                <Text style={[styles.carouselTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.carouselDesc, { color: theme.subText }]}>{item.desc}</Text>
              </View>
            </Animated.View>
          )}
        />
      </View>

      {/* Actions List */}
      <View style={styles.actionSection}>
        <Text style={styles.categoryLabel}>MANAGEMENT</Text>
        <View style={[styles.bentoGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActionItem
            icon={isDark ? "moon" : "sunny"}
            title="Appearance"
            rightText={isDark ? "Dark" : "Light"}
            color="#8B5CF6"
            isToggle={true}
            toggleValue={isDark}
            onToggle={toggleTheme}
          />
          <ActionItem
            icon="notifications"
            title="Notification Hub"
            color="#3B82F6"
            onPress={() => { }}
          />
        </View>

        <Text style={styles.categoryLabel}>FINANCIAL SUITE</Text>
        <View style={[styles.bentoGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.paymentSelector}>
            <TouchableOpacity
              style={[
                styles.payOption,
                appUser?.paymentMethod === 'upi' && { backgroundColor: theme.bg },
                { borderColor: appUser?.paymentMethod === 'upi' ? '#FF4D67' : 'transparent' }
              ]}
              onPress={() => user?.uid && updateUserProfile(user.uid, { paymentMethod: 'upi' })}
            >
              <MaterialCommunityIcons name="integrated-circuit-chip" size={18} color={appUser?.paymentMethod === 'upi' ? '#FF4D67' : theme.subText} />
              <Text style={[styles.payOptionText, { color: appUser?.paymentMethod === 'upi' ? theme.text : theme.subText }]}>UPI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payOption,
                appUser?.paymentMethod === 'card' && { backgroundColor: theme.bg },
                { borderColor: appUser?.paymentMethod === 'card' ? '#FF4D67' : 'transparent' }
              ]}
              onPress={() => user?.uid && updateUserProfile(user.uid, { paymentMethod: 'card' })}
            >
              <Ionicons name="card" size={18} color={appUser?.paymentMethod === 'card' ? '#FF4D67' : theme.subText} />
              <Text style={[styles.payOptionText, { color: appUser?.paymentMethod === 'card' ? theme.text : theme.subText }]}>Card</Text>
            </TouchableOpacity>
          </View>
          <ActionItem icon="receipt" title="Billing History" color="#10B981" onPress={() => router.push('/(men)/tx-history')} />
          <ActionItem icon="time" title="Interaction Logs" color="#3B82F6" onPress={() => router.push('/(men)/call-history')} isLast={true} />
        </View>

        <Text style={styles.categoryLabel}>SUPPORT & LEGAL</Text>
        <View style={[styles.bentoGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActionItem icon="book" title="App Guide" color="#0EA5E9" onPress={() => router.push('/guide')} />
          <ActionItem icon="help-buoy" title="Help Desk" color="#EC4899" onPress={() => router.push('/support')} />
          <ActionItem icon="shield-checkmark" title="Privacy Policy" color="#10B981" onPress={() => router.push('/privacy')} />
          <ActionItem icon="document-text" title="Terms of Service" color="#6366f1" onPress={() => router.push('/terms')} isLast={true} />
        </View>

        <TouchableOpacity
          style={[styles.logoutWrapper, { borderColor: 'rgba(255, 77, 103, 0.3)' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4D67" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerInfoCover: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 25,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#333',
  },
  membershipBadgeWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  nameSection: {
    flex: 1,
  },
  levelRow: {
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    opacity: 0.1,
  },
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  goldCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 180,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cardPattern: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardType: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  cardMain: {
    marginVertical: 15,
  },
  balanceLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  balanceUnit: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHolder: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topUpBtn: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  topUpText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 11,
  },
  carouselContainer: {
    marginBottom: 35,
  },
  carouselCard: {
    width: width * 0.75,
    borderRadius: 20,
    padding: 20,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
  },
  carouselIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselText: {
    flex: 1,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  carouselDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#666',
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 2,
  },
  bentoGroup: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 25,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  rightText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 12,
    marginRight: 10,
  },
  paymentSelector: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1.5,
    gap: 8,
  },
  payOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  logoutWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#FF4D67',
    fontSize: 15,
    fontWeight: '800',
  },
});
