import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, RefreshControl, Animated, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToFemaleCreators, User as FirestoreUser, getAvatarSource, toggleFavorite, initiateCallSession, fetchMoreFemaleCreators, subscribeToCallHistory, CallRecord, updateUserBalance, recordTransaction, subscribeToBestieCreators } from '../../services/firebaseService';
import { Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const FEMALE_AVATARS = [
  require('../../assets/images/3d_avatar_1.jpg'),
  require('../../assets/images/3d_avatar_2.jpg'),
  require('../../assets/images/3d_avatar_3.jpg'),
  require('../../assets/images/3d_avatar_4.jpg'),
];

// Memoized Card Component to prevent unnecessary re-renders
const CreatorCard = memo(({
  item,
  onToggleBestie,
  onCall,
  isBestie,
  colors
}: {
  item: FirestoreUser,
  onToggleBestie: (id: string) => void,
  onCall: (user: FirestoreUser, type: 'audio' | 'video') => void,
  isBestie: boolean,
  colors: any
}) => {
  return (
    <View style={styles.card}>
      <Image
        source={getAvatarSource(item.avatar, 'woman')}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient colors={['transparent', 'rgba(15,15,19,0.9)']} style={styles.gradient} />

      <View style={styles.cardTop}>
        <View style={styles.onlineBadge}>
          <View style={[styles.onlineDot, { backgroundColor: item.isOnline ? '#4CAF50' : '#FF4D67' }]} />
          <Text style={styles.onlineText}>{item.isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity
          style={styles.bestieButton}
          onPress={() => onToggleBestie(item.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isBestie ? "heart" : "heart-outline"}
            size={22}
            color={isBestie ? "#FF4D67" : "#fff"}
          />
          {!isBestie && (
            <View style={styles.bestieUnitDivider} />
          )}
          {!isBestie && (
            <View style={styles.bestieUnitCost}>
              <Ionicons name="flash" size={12} color="#FFD700" />
              <Text style={styles.bestieUnitCostText}>10</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.displayName || item.name}</Text>
            <View style={styles.hobbiesRow}>
              {item.hobbies?.slice(0, 3).map((hobby, index) => (
                <View key={index} style={[styles.hobbyChip, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.hobbyText, { color: colors.primary }]}>{hobby}</Text>
                </View>
              ))}
              {(item.hobbies?.length || 0) > 3 && (
                <View style={[styles.hobbyChip, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[styles.hobbyText, { color: '#fff' }]}>+{item.hobbies!.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{(item as any).rating?.toFixed(1) || (item as any).avgRating?.toFixed(1) || '0.0'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.callButton,
              { backgroundColor: item.isAudioOnline ? '#FF4D67' : 'rgba(255, 77, 103, 0.15)' }
            ]}
            activeOpacity={0.8}
            onPress={() => onCall(item, 'audio')}
            disabled={!item.isAudioOnline}
          >
            <View style={[styles.callIconBox, { backgroundColor: item.isAudioOnline ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="call" size={18} color={item.isAudioOnline ? "#fff" : "rgba(255,255,255,0.3)"} />
            </View>
            <View style={styles.callInfoBox}>
              <Text style={[styles.callText, { color: item.isAudioOnline ? "#fff" : "rgba(255,255,255,0.4)" }]}>Audio</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: item.isAudioOnline ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }]}>10</Text>
                <Text style={[styles.perMinText, { color: item.isAudioOnline ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }]}>/min</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.callButton,
              { backgroundColor: item.isVideoOnline ? '#9C27B0' : 'rgba(156, 39, 176, 0.15)' }
            ]}
            activeOpacity={0.8}
            onPress={() => onCall(item, 'video')}
            disabled={!item.isVideoOnline}
          >
            <View style={[styles.callIconBox, { backgroundColor: item.isVideoOnline ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="videocam" size={18} color={item.isVideoOnline ? "#fff" : "rgba(255,255,255,0.3)"} />
            </View>
            <View style={styles.callInfoBox}>
              <Text style={[styles.callText, { color: item.isVideoOnline ? "#fff" : "rgba(255,255,255,0.4)" }]}>Video</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: item.isVideoOnline ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }]}>60</Text>
                <Text style={[styles.perMinText, { color: item.isVideoOnline ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }]}>/min</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// A simple Skeleton Card component to show while loading
const SkeletonCard = () => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [animValue]);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={[styles.card, { backgroundColor: '#1E1E24', borderColor: '#333' }]}>
      <Animated.View style={{ flex: 1, backgroundColor: '#2a2a35', opacity }} />
      <View style={styles.infoContainer}>
        <Animated.View style={{ height: 28, width: 140, backgroundColor: '#333', borderRadius: 8, marginBottom: 12, opacity }} />
        <View style={styles.hobbiesRow}>
          <Animated.View style={{ height: 20, width: 60, backgroundColor: '#333', borderRadius: 6, opacity }} />
          <Animated.View style={{ height: 20, width: 80, backgroundColor: '#333', borderRadius: 6, opacity }} />
          <Animated.View style={{ height: 20, width: 50, backgroundColor: '#333', borderRadius: 6, opacity }} />
        </View>
        <Animated.View style={{ height: 16, width: '90%', backgroundColor: '#333', borderRadius: 6, marginBottom: 20, marginTop: 12, opacity }} />
        <View style={styles.actionRow}>
          <Animated.View style={[styles.callButton, { backgroundColor: '#333', flex: 1, opacity }]} />
          <Animated.View style={[styles.callButton, { backgroundColor: '#333', flex: 1, opacity }]} />
        </View>
      </View>
    </View>
  );
};

export default function MenHome() {
  const [activeTab, setActiveTab] = useState('Buddies'); // 'Buddies' | 'Bestie'
  const [creators, setCreators] = useState<FirestoreUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [besties, setBesties] = useState<FirestoreUser[]>([]);
  const lastDocRef = useRef<any>(null);
  const { colors } = useTheme();
  const { appUser, loading } = useAuth();
  const router = useRouter();

  // Listen for female creators in real-time
  useEffect(() => {
    if (loading) return;

    const unsubscribe = subscribeToFemaleCreators((list) => {
      setCreators(list);
      setIsLoading(false);
    }, 200);

    return () => unsubscribe();
  }, [loading]);

  // Listen for Bestie profiles specifically (regardless of online status)
  useEffect(() => {
    if (loading || !appUser?.besties?.length) {
      if (!loading) setBesties([]);
      return;
    }

    const unsubscribe = subscribeToBestieCreators(appUser.besties, (list) => {
      setBesties(list);
    });

    return () => unsubscribe();
  }, [loading, appUser?.besties]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleBestie = useCallback(async (creatorId: string) => {
    if (!appUser?.id) return;
    const isCurrentlyFavorite = appUser.besties?.includes(creatorId) || false;

    if (!isCurrentlyFavorite) {
      const userGold = appUser.coins || 0;
      if (userGold < 10) {
        Alert.alert(
          "Insufficient Gold",
          "Adding a Bestie costs 10 gold. Would you like to top up?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Top Up", onPress: () => router.push('/(men)/wallet') }
          ]
        );
        return;
      }

      Alert.alert(
        "Add Bestie",
        "It costs 10 gold to add this creator to your Bestie list. Proceed?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add (10 Gold)",
            onPress: async () => {
              const creator = creators.find(c => c.id === creatorId) || besties.find(c => c.id === creatorId);
              const creatorName = creator?.displayName || creator?.name || 'User';

              const newBalance = userGold - 10;
              await updateUserBalance(appUser.id, newBalance);
              await recordTransaction({
                userId: appUser.id,
                type: 'bestie_spend',
                coins: 10,
                amountInRupees: 1,
                status: 'success',
                timestamp: Timestamp.now(),
                details: `Added ${creatorName} as Bestie`
              });
              await toggleFavorite(appUser.id, creatorId, true);
            }
          }
        ]
      );
    } else {
      await toggleFavorite(appUser.id, creatorId, false);
    }
  }, [appUser?.id, appUser?.besties, appUser?.coins, router]);

  const handleCall = useCallback(async (creator: FirestoreUser, type: 'audio' | 'video') => {
    if (!appUser) return;

    const requiredGold = type === 'audio' ? 10 : 60;
    const userGold = appUser.coins || 0;

    if (userGold < requiredGold) {
      Alert.alert(
        "Insufficient Gold",
        `You need at least ${requiredGold} gold for a 1-minute ${type} call. Would you like to top up?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Top Up", onPress: () => router.push('/(men)/wallet') }
        ]
      );
      return;
    }

    const channelId = `call_${Date.now()}`;

    try {
      const sessionId = await initiateCallSession({
        callerId: appUser.id,
        callerName: appUser.displayName || 'Anonymous',
        callerAvatar: appUser.avatar,
        receiverId: creator.id,
        receiverName: creator.displayName || 'Creator',
        receiverAvatar: creator.avatar,
        status: 'ringing',
        type,
        channelId,
        timestamp: Timestamp.now(),
      });

      if (!sessionId) throw new Error('Failed to initiate call');

      router.push({
        pathname: '/call/[id]' as any,
        params: {
          id: sessionId,
          type,
          creatorName: creator.displayName,
          creatorAvatar: creator.avatar,
          channelId,
          role: 'caller'
        }
      });
    } catch (error) {
      console.error('Call initiation error:', error);
      Alert.alert('Error', 'Could not start the call. Please try again.');
    }
  }, [appUser, router]);

  const loadMore = async () => {
    if (isMoreLoading || !hasMore || activeTab === 'Bestie') return;
  };

  const filteredData = activeTab === 'Bestie' ? besties : creators;

  const renderItem = ({ item }: { item: FirestoreUser }) => (
    <CreatorCard
      item={item}
      colors={colors}
      isBestie={appUser?.besties?.includes(item.id) || false}
      onToggleBestie={toggleBestie}
      onCall={handleCall}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'Buddies' && styles.activeToggleButton]}
            onPress={() => setActiveTab('Buddies')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, activeTab === 'Buddies' ? styles.activeToggleText : { color: colors.subText }]}>Buddies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'Bestie' && styles.activeToggleButton]}
            onPress={() => setActiveTab('Bestie')}
            activeOpacity={0.8}
          >
            <View style={styles.bestieToggleContent}>
              <Text style={[styles.toggleText, activeTab === 'Bestie' ? styles.activeToggleText : { color: colors.subText }]}>Bestie</Text>
              <Ionicons name="heart" size={14} color={activeTab === 'Bestie' ? "#fff" : colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={appUser?.besties}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF4D67"
              colors={['#FF4D67']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                {activeTab === 'Bestie'
                  ? "You haven't added any Besties yet."
                  : "Scanning the galaxy for creators..."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  toggleWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E24',
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleButton: {
    flex: 1,
    height: 40,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggleButton: {
    backgroundColor: '#FF4D67',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeToggleText: {
    color: '#fff',
  },
  bestieToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  card: {
    width: width * 0.9,
    height: 500,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  cardTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bestieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    gap: 8,
  },
  bestieUnitDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bestieUnitCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bestieUnitCostText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 4,
  },
  ratingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  hobbiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  hobbyChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hobbyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  callText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  perMinText: {
    fontSize: 8,
    fontWeight: '500',
    marginLeft: 1,
  },
  callIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  callInfoBox: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#808080',
    fontSize: 18,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    minWidth: 160,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentTime: {
    fontSize: 12,
    opacity: 0.7,
  }
});
