import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { subscribeToActivePods, Pod as FirestorePod } from '../../services/firebaseService';


export default function Pods() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [activePods, setActivePods] = useState<FirestorePod[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const unsubscribe = subscribeToActivePods((pods) => {
      setActivePods(pods);
      setIsDataLoading(false);
    });
    return () => unsubscribe();
  }, [authLoading]);

  const renderItem = ({ item }: { item: FirestorePod }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })}
    >
      <Image
        source={require('../../assets/images/3d_avatar_2.jpg')} // Fallback or dynamic based on hostId
        style={styles.image}
      />
      <LinearGradient colors={['rgba(0,0,0,0.2)', isDark ? 'rgba(15,15,19,0.95)' : 'rgba(255,255,255,0.95)']} style={styles.gradient} />

      <View style={styles.liveBadge}>
        <Ionicons name="radio" size={14} color="#fff" />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.host, { color: colors.subText }]}>Hosted by {item.hostName}</Text>

        <View style={styles.statsRow}>
          <View style={styles.listenersBadge}>
            <Ionicons name="headset" size={16} color="#4CAF50" />
            <Text style={styles.listenersText}>{item.participants} listening</Text>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.text }]}
            onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })}
          >
            <Text style={[styles.joinText, { color: colors.bg }]}>Join Pod</Text>
          </TouchableOpacity>
        </View>
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
            tintColor="#FF4D67"
            colors={['#FF4D67']}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Active Voice Pods</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>Join group calls, send meme gifts & vibe!</Text>
          </View>
        }
        ListEmptyComponent={
          !isDataLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mic-off" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>No active pods right now. Check back later!</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Pad enough so floating footer doesn't hide last item
    gap: 20,
  },
  header: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  card: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF4D67',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priceTextPopular: {
    color: '#000',
  },
  emptyContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 40,
  },
  liveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  host: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listenersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  listenersText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinText: {
    color: '#0f0f13',
    fontWeight: '800',
    fontSize: 14,
  },
});
