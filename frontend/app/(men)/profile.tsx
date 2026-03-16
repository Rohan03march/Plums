import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Switch, Alert, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarSource } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const SAFETY_TIPS = [
  { id: '1', title: 'Be Kind', desc: 'Say no to bad talks. Treat everyone with respect.', icon: 'heart' as const },
  { id: '2', title: 'Stay Safe', desc: 'Never share personal financial information.', icon: 'shield-checkmark' as const },
  { id: '3', title: 'Report Abuse', desc: 'Use the block feature for any inappropriate behavior.', icon: 'warning' as const },
];

export default function Profile() {
  const router = useRouter();
  const { isDark, toggleTheme, colors: theme } = useTheme();
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
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={getAvatarSource(appUser?.avatar, 'man')} 
            style={[styles.avatar, { borderColor: theme.border }]} 
          />
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{appUser?.displayName || 'User'}</Text>
        <Text style={[styles.username, { color: theme.subText }]}>@{appUser?.username || 'user'}</Text>
      </View>

      {/* Gold Shop Banner */}
      <TouchableOpacity onPress={() => router.push('/(men)/wallet')} activeOpacity={0.9}>
        <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.goldBanner} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={styles.goldBannerLeft}>
            <FontAwesome5 name="coins" size={24} color="#000" />
            <View>
              <Text style={styles.goldTitle}>Gold Shop</Text>
              <Text style={styles.goldSub}>Balance: {appUser?.coins || 0} Gold</Text>
            </View>
          </View>
          <View style={styles.goldBtn}>
            <Text style={styles.goldBtnText}>Top Up</Text>
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
            <View style={[styles.carouselCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name={item.icon} size={28} color="#FF4D67" />
              <View style={styles.carouselText}>
                <Text style={[styles.carouselTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.carouselDesc, { color: theme.subText }]}>{item.desc}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Actions List */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <ActionItem 
          icon={isDark ? "moon" : "sunny"} 
          title="Dark Mode" 
          color="#8B5CF6" 
          isToggle={true}
          toggleValue={isDark}
          onToggle={toggleTheme}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>History</Text>
        <ActionItem icon="time" title="Call History" color="#3B82F6" onPress={() => router.push('/(men)/call-history')} />
        <ActionItem icon="receipt" title="Transaction History" color="#10B981" onPress={() => router.push('/(men)/tx-history')} />
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Earn & Refer</Text>
        <ActionItem icon="gift" title="Refer a Friend" rightText="+50 Gold" color="#F59E0B" onPress={() => {}} />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Support</Text>
        <ActionItem icon="book" title="App Guide" color="#0EA5E9" onPress={() => {}} />
        <ActionItem icon="help-buoy" title="Help & Support" color="#EC4899" onPress={() => {}} />
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}></Text>
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
    borderColor: '#333',
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
  goldBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  goldBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  goldTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: '800',
  },
  goldSub: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  goldBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goldBtnText: {
    color: '#FFD700',
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
    color: '#FFD700',
    fontWeight: '700',
    marginRight: 10,
  },
});
