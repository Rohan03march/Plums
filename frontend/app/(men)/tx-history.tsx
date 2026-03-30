import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTransactions, Transaction, fetchMoreTransactions, formatFirebaseDate } from '../../services/firebaseService';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HistoryItem = memo(({ item, colors, accentColor, isCredit }: { item: Transaction, colors: any, accentColor: string, isCredit: boolean }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardLeft}>
      <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
        <Ionicons 
          name={
            item.type === 'deposit' ? 'wallet' : 
            item.type === 'withdrawal' ? 'cash' : 
            item.type === 'refund' ? 'refresh-circle' : 
            item.type === 'bestie_spend' ? 'heart' :
            (item.type === 'gift_spend' ? 'gift' : 'call')
          } 
          size={20} 
          color={accentColor} 
        />
      </View>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>
          {item.type === 'deposit' ? 'Recharge' : 
           item.type === 'withdrawal' ? 'Withdrawal' : 
           item.type === 'call_spend' ? 'Call Payment' : 
           item.type === 'gift_spend' ? 'Gift Sent' : 
           item.type === 'bestie_spend' ? (item.details || 'Bestie Added') :
           item.type === 'refund' ? 'Refund' : 'Transaction'}
        </Text>
        <Text style={[styles.date, { color: colors.subText }]}>
          {formatFirebaseDate(item.timestamp)}
        </Text>
      </View>
    </View>
    <View style={styles.cardRight}>
      <View style={[styles.coinBadge, { backgroundColor: `${accentColor}10` }]}>
        <Text style={[styles.coins, { color: accentColor }]}>
          {isCredit ? '+' : '-'}{item.coins}
        </Text>
        <FontAwesome5 name="coins" size={10} color="#FFD700" />
      </View>
      {item.type === 'call_spend' && item.details?.includes('duration:') && (
        <Text style={styles.talktimeText}>
          {item.details.split('duration:')[1].trim()} talktime
        </Text>
      )}
    </View>
  </View>
));

export default function TransactionHistory() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<'gold' | 'recharge'>('gold');

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const types = activeTab === 'gold' ? ['call_spend', 'gift_spend', 'bestie_spend'] : ['deposit', 'refund'];
      const response = await fetchMoreTransactions(user.uid, null, 20, types);
      setTransactions(response.list);
      lastDocRef.current = response.lastVisible;
      setHasMore(response.list.length === 20);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, activeTab]);

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
      const types = activeTab === 'gold' ? ['call_spend', 'gift_spend', 'bestie_spend'] : ['deposit', 'refund'];
      const response = await fetchMoreTransactions(user.uid, lastDocRef.current, 20, types);
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

  const filteredTransactions = transactions;

  const renderItem = useCallback(({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'deposit' || item.type === 'refund';
    const accentColor = isCredit ? '#4CAF50' : '#FF4D67';
    
    return (
      <HistoryItem 
        item={item} 
        colors={colors} 
        accentColor={accentColor} 
        isCredit={isCredit} 
      />
    );
  }, [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id!}
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
          <>
            <View style={styles.header}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: colors.card }]} 
                onPress={() => router.push('/(men)/profile')}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction History</Text>
              <Text style={[styles.headerSub, { color: colors.subText }]}>Track your spendings and earnings</Text>
          </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'gold' && styles.activeTab]} 
                onPress={() => setActiveTab('gold')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'gold' ? '#fff' : colors.subText }]}>Gold Spent</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'recharge' && styles.activeTab]} 
                onPress={() => setActiveTab('recharge')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'recharge' ? '#fff' : colors.subText }]}>Recharge</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          !isDataLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No transactions found for this category.</Text>
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
    backgroundColor: '#0f0f13',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
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
    backgroundColor: '#1E1E24',
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
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
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.6,
  },
  coins: {
    fontSize: 16,
    fontWeight: '800',
  },
  talktimeText: {
    fontSize: 12,
    color: '#FF4D67',
    fontWeight: '700',
    marginTop: 2,
    opacity: 0.9,
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
