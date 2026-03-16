import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarSource } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Protect Privacy', desc: 'Never share personal addresses.', icon: 'shield-checkmark' as const },
  { id: '2', title: 'Set Boundaries', desc: 'You are in control of the call always.', icon: 'hand-left' as const },
  { id: '3', title: 'Report Users', desc: 'Block abusive callers immediately.', icon: 'warning' as const },
];

export default function Profile() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { appUser, signOut } = useAuth();
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
    <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionTitle, { color: color === '#FF4D67' ? color : colors.text }]}>{title}</Text>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bg }]} 
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
      {/* Header Profile Area */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={getAvatarSource(appUser?.avatar, 'woman')} 
            style={[styles.avatar, { borderColor: colors.primary }]} 
          />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{appUser?.displayName || 'Creator'} ✨</Text>
        <Text style={[styles.username, { color: colors.subText }]}>@{appUser?.username || 'user'}</Text>
      </View>

      {/* Withdraw Banner */}
      <TouchableOpacity onPress={() => router.push('/(women)/withdrawal')} activeOpacity={0.9}>
        <LinearGradient colors={isDark ? ['#FF4D67', '#FF8A9B'] : ['#EC4899', '#F472B6']} style={styles.premiumBanner} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={styles.premiumBannerLeft}>
            <View style={styles.premiumIconBox}>
              <Ionicons name="wallet" size={24} color="#FF4D67" />
            </View>
            <View>
              <Text style={styles.premiumTitle}>Wallet & Payouts</Text>
              <Text style={styles.premiumSub}>Balance: ₹{(appUser?.coins || 0) / 10}</Text>
            </View>
          </View>
          <View style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>Manage</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF4D67" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Safety Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={SAFETY_TIPS}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.8 + 15}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.carouselCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={item.icon} size={28} color={colors.primary} />
              <View style={styles.carouselText}>
                <Text style={[styles.carouselTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.carouselDesc, { color: colors.subText }]}>{item.desc}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Actions List */}
      <View style={styles.actionSection}>
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Preferences</Text>
        <ActionItem 
          icon={isDark ? "moon" : "sunny"} 
          title="Dark Mode" 
          color="#8B5CF6" 
          onPress={() => toggleTheme()} 
        />
        
        <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 20 }]}>History & Growth</Text>
        <ActionItem icon="call" title="Call Logs" color="#3B82F6" onPress={() => router.push('/(women)/call-history')} />
        <ActionItem icon="receipt" title="Payout History" color="#10B981" onPress={() => router.push('/(women)/tx-history')} />
        <ActionItem icon="trending-up" title="Insights & Stats" color="#8B5CF6" onPress={() => {}} />

        <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 20 }]}>Earn & Refer</Text>
        <ActionItem icon="gift" title="Refer a Friend" rightText="+10% Bonus" color="#F59E0B" onPress={() => {}} />

        <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 20 }]}>Support</Text>
        <ActionItem icon="book" title="Creator Guide" color="#0EA5E9" onPress={() => {}} />
        <ActionItem icon="help-buoy" title="Help & Support" color="#EC4899" onPress={() => {}} />
        
        <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 20 }]}></Text>
        <ActionItem icon="log-out" title="Logout" color="#FF4D67" onPress={handleLogout} />
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF4D67',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4D67',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0f0f13',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  premiumBanner: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  premiumIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  premiumSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  premiumBtnText: {
    color: '#FF4D67',
    fontWeight: '800',
    fontSize: 14,
  },
  carouselContainer: {
    marginBottom: 30,
  },
  carouselCard: {
    width: width * 0.8,
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  carouselText: {
    flex: 1,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  carouselDesc: {
    color: '#a0a0a0',
    fontSize: 12,
    lineHeight: 18,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rightText: {
    color: '#F59E0B',
    fontWeight: '700',
    marginRight: 10,
  },
});
