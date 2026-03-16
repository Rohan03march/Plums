import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToCallHistory, CallRecord as FirestoreCall, getAvatarSource, fetchMoreCallHistory, formatFirebaseDate } from '../../services/firebaseService';

const CallItem = memo(({ item, colors, isMissed }: { item: FirestoreCall, colors: any, isMissed: boolean }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.imageContainer}>
      <Image
        source={getAvatarSource(item.receiverAvatar, 'woman')}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={[styles.statusDot, { backgroundColor: isMissed ? '#FF4D67' : '#4CAF50' }]} />
    </View>
    <View style={styles.info}>
      <View style={styles.topRow}>
        <Text style={[styles.name, { color: colors.text }]}>{item.receiverName}</Text>
        <View style={styles.costBadge}>
          <Text style={styles.costText}>-{item.cost}</Text>
          <FontAwesome5 name="coins" size={12} color="#FFD700" />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.typeBadge}>
          <View style={[styles.iconCircle, { backgroundColor: item.type === 'video' ? 'rgba(255, 77, 103, 0.1)' : 'rgba(76, 175, 80, 0.1)' }]}>
            <Ionicons
              name={item.type === 'video' ? 'videocam' : 'call'}
              size={14}
              color={item.type === 'video' ? '#FF4D67' : '#4CAF50'}
            />
          </View>
          <Text style={[styles.typeText, { color: colors.subText }]}>{item.duration}</Text>
        </View>
        <Text style={[styles.date, { color: colors.subText }]}>
          {formatFirebaseDate(item.timestamp)}
        </Text>
      </View>
    </View>
  </View>
));

export default function CallHistory() {
  const { colors } = useTheme();
  const { appUser, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [calls, setCalls] = useState<FirestoreCall[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<any>(null);

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const response = await fetchMoreCallHistory(user.uid, null, 20);
      setCalls(response.list);
      lastDocRef.current = response.lastVisible;
      setHasMore(response.list.length === 20);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  const loadMore = async () => {
    if (isMoreLoading || !hasMore || !user || !lastDocRef.current) return;

    setIsMoreLoading(true);
    try {
      const response = await fetchMoreCallHistory(user.uid, lastDocRef.current, 20);
      if (response.list.length > 0) {
        setCalls(prev => [...prev, ...response.list]);
        lastDocRef.current = response.lastVisible;
        setHasMore(response.list.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more call history:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const renderItem = useCallback(({ item }: { item: FirestoreCall }) => {
    const isMissed = item.duration === '0:00' || item.duration === 'Missed';

    return (
      <CallItem
        item={item}
        colors={colors}
        isMissed={isMissed}
      />
    );
  }, [colors]);

  if (isDataLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FF4D67" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(men)/profile')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Call History</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>Review your recent conversations</Text>
            {/* {__DEV__ && (
              <Text style={{ fontSize: 10, color: colors.subText, opacity: 0.5, marginTop: 4 }}>
                Debug ID: {user?.uid}
              </Text>
            )} */}
          </View>
        }
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
            <Ionicons name="call-outline" size={64} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>No call history yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  list: {
    padding: 20,
    gap: 15,
  },
  header: {
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
  },
  headerSub: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E24',
    padding: 15,
    borderRadius: 22,
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E1E24',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  costText: {
    color: '#FF4D67',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  emptyContainer: {
    paddingVertical: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
