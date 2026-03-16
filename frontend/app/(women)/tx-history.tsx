import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTransactions, Transaction, fetchMoreTransactions, formatFirebaseDate } from '../../services/firebaseService';

const TransactionItem = memo(({ item, colors, isCredit, statusColor, typeLabel }: { item: Transaction, colors: any, isCredit: boolean, statusColor: string, typeLabel: string }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardLeft}>
      <View style={[styles.iconBox, { backgroundColor: isCredit ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 103, 0.1)' }]}>
        <Ionicons 
          name={item.type === 'withdrawal' ? 'cash' : (item.type === 'refund' ? 'refresh' : (item.type === 'deposit' ? 'wallet' : 'call'))} 
          size={22} 
          color={isCredit ? '#4CAF50' : '#FF4D67'} 
        />
      </View>
      <View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{typeLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.subText }]}>
          {formatFirebaseDate(item.timestamp)}
        </Text>
      </View>
    </View>
    <View style={styles.cardRight}>
      <View style={styles.coinRow}>
        <Text style={[styles.coins, { color: isCredit ? '#4CAF50' : '#FF4D67' }]}>
          {isCredit ? '+' : '-'}{item.coins}
        </Text>
        <FontAwesome5 name="coins" size={10} color="#FFD700" />
      </View>
      <Text style={styles.amount}>₹{item.amountInRupees}</Text>
    </View>
  </View>
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
      return tx.type === 'call_earn' || tx.type === 'gift_earn' || tx.type === 'deposit'; // deposit if they recharge? Usually women just earn.
    } else {
      return tx.type === 'withdrawal' || tx.type === 'refund';
    }
  });

  const renderItem = useCallback(({ item }: { item: Transaction }) => {
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
      />
    );
  }, [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(women)/profile')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Wallet History</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>Track your earnings and withdrawals</Text>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'earning' && styles.activeTab]} 
                onPress={() => setActiveTab('earning')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'earning' ? '#fff' : colors.subText }]}>Earning</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'withdrawn' && styles.activeTab]} 
                onPress={() => setActiveTab('withdrawn')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'withdrawn' ? '#fff' : colors.subText }]}>Withdrawn</Text>
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
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FF4D67',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  date: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
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
