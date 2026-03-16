import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToActivePods, Pod as FirestorePod } from '../../services/firebaseService';

export default function Pods() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [activePods, setActivePods] = useState<FirestorePod[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Pods are synced via listener, so we just add a delay for feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const unsubscribe = subscribeToActivePods((pods) => {
      setActivePods(pods);
    });
    return () => unsubscribe();
  }, [authLoading]);

  const renderItem = ({ item }: { item: FirestorePod }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardContent}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.host, { color: colors.subText }]}>Hosted by {item.hostName}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.listenersBadge}>
              <Ionicons name="headset" size={14} color="#4CAF50" />
              <Text style={styles.listenersText}>{item.participants} listening</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })}
        >
          <Ionicons name="mic" size={20} color="#fff" />
          <Text style={styles.joinText}>Join</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={activePods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Voice Pods</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>Hop in to chat, sing or just listen!</Text>
          </View>
        }
        ListEmptyComponent={
          !authLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mic-off" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No active pods. Start one now!</Text>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSub: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // accommodate bottom tab
    gap: 16,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1E1E24',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  host: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D67',
  },
  liveText: {
    color: '#FF4D67',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listenersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listenersText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF4D67',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  joinText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
