import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, Layout, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { subscribeToTransactions, Transaction, fetchMoreTransactions, formatFirebaseDate } from '../../services/firebaseService';

const { width, height } = Dimensions.get('window');

const FloatingOrb = ({ color, size, delay = 0 }: { color: string, size: number, delay?: number }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useMemo(() => {
    tx.value = withRepeat(withTiming(Math.random() * 50 - 25, { duration: 4000 + delay }), -1, true);
    ty.value = withRepeat(withTiming(Math.random() * 50 - 25, { duration: 5000 + delay }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle
      ]}
    />
  );
};

const TransactionItem = memo(({ item, colors, isCredit, statusColor, typeLabel, index }: { item: Transaction, colors: any, isCredit: boolean, statusColor: string, typeLabel: string, index: number }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 100).duration(600).springify()}
    layout={Layout.springify()}
    style={[
      styles.card, 
      { 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderColor: 'rgba(255,255,255,0.06)'
      }
    ]}
  >
    <View style={styles.cardLeft}>
      <LinearGradient 
        colors={isCredit ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)'] : ['rgba(255, 77, 103, 0.15)', 'rgba(255, 77, 103, 0.05)']}
        style={styles.iconBox}
      >
        <Ionicons 
          name={
            item.type === 'withdrawal' ? 'cash' : 
            (item.type === 'refund' ? 'refresh' : 
            (item.type === 'deposit' ? 'wallet' : 
            (item.details?.includes('VIDEO') ? 'videocam' : 'call')))
          } 
          size={22} 
          color={isCredit ? '#4CAF50' : '#FF4D67'} 
        />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{typeLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={[styles.date, { color: colors.subText }]}>
            {formatFirebaseDate(item.timestamp)}
          </Text>
        </View>
      </View>
    </View>
    <View style={styles.cardRight}>
      <View style={styles.coinRow}>
        <Text style={[styles.coins, { color: isCredit ? '#4CAF50' : '#FF4D67' }]}>
          {isCredit ? '+' : '-'}{item.coins}
        </Text>
        <FontAwesome5 name="coins" size={10} color="#FFD700" />
      </View>
      <Text style={styles.amount}>₹{Number(item.amountInRupees).toFixed(2)}</Text>
    </View>
  </Animated.View>
));

export default function WithdrawalHistory() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<'earning' | 'withdrawn'>('earning');

  const togglePos = useSharedValue(0);

  const handleTabChange = useCallback((newTab: 'earning' | 'withdrawn') => {
    setActiveTab(newTab);
    togglePos.value = withSpring(newTab === 'earning' ? 0 : 1, { damping: 15 });
  }, []);

  const toggleIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: togglePos.value * ((width - 48) / 2) }],
  }));

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const response = await fetchMoreTransactions(user.uid, null, 20);
      setTransactions(response.list);
      lastDocRef.current = response.lastVisible;
      setHasMore(response.list.length === 20);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
      const response = await fetchMoreTransactions(user.uid, lastDocRef.current, 20);
      if (response.list.length > 0) {
        setTransactions(prev => [...prev, ...response.list]);
        lastDocRef.current = response.lastVisible;
        setHasMore(response.list.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more transactions:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'earning') {
      return tx.type === 'call_earn' || tx.type === 'gift_earn' || tx.type === 'deposit';
    } else {
      return tx.type === 'withdrawal' || tx.type === 'refund';
    }
  });

  const renderItem = useCallback(({ item, index }: { item: Transaction, index: number }) => {
    const isCredit = item.type === 'call_earn' || item.type === 'gift_earn' || item.type === 'deposit' || item.type === 'refund';
    const statusColor = item.status === 'success' ? '#4CAF50' : item.status === 'pending' ? '#FFD700' : '#FF4D67';
    const typeLabel = item.type === 'withdrawal' ? 'Withdrawal' : (item.type === 'refund' ? 'Refund' : (item.type === 'deposit' ? 'Deposit' : (item.type === 'gift_earn' ? 'Gift Received' : 'Call Earning')));

    return (
      <TransactionItem
        item={item}
        colors={colors}
        isCredit={isCredit}
        statusColor={statusColor}
        typeLabel={typeLabel}
        index={index}
      />
    );
  }, [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.bgDecorations} pointerEvents="none">
        <FloatingOrb color="rgba(255, 77, 103, 0.15)" size={200} delay={0} />
        <View style={{ position: 'absolute', top: 200, left: -80 }}>
          <FloatingOrb color="rgba(156, 39, 176, 0.1)" size={250} delay={1000} />
        </View>
        <View style={{ position: 'absolute', bottom: -100, right: -50 }}>
          <FloatingOrb color="rgba(77, 124, 255, 0.05)" size={300} delay={2000} />
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderItem}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF4D67"
            colors={['#FF4D67']}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(women)/profile')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>
                Wallet History
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
              <Text style={[styles.headerSub, { color: colors.subText }]}>
                Track your earnings and withdrawals
              </Text>
            </Animated.View>

            <View style={[styles.methodToggle, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => handleTabChange('earning')}
              >
                <Text style={[styles.toggleText, { color: activeTab === 'earning' ? '#fff' : colors.subText }]}>
                  Earnings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => handleTabChange('withdrawn')}
              >
                <Text style={[styles.toggleText, { color: activeTab === 'withdrawn' ? '#fff' : colors.subText }]}>
                  Withdrawals
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No transactions yet.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 15,
  },
  bgDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blob: {
    position: 'absolute',
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  headerSub: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 10,
  },
  methodToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    marginTop: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    zIndex: 1,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: (width - 48) / 2, 
    backgroundColor: '#FF4D67',
    borderRadius: 20,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coins: {
    fontSize: 18,
    fontWeight: '800',
  },
  amount: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '600',
  },
  emptyContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
