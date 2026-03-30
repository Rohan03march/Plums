import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { recordTransaction, updateUserBalance, subscribeToGoldPlans, GoldPlan } from '../../services/firebaseService';
import { NativeModules } from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';

// Safely handle Razorpay import for Expo Go
const RazorpayCheckout = NativeModules.RazorpayCheckout
  ? require('react-native-razorpay').default
  : null;

import { Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 16) / 2; // (width - horizontalPadding - gap) / 2

import { BACKEND_URL } from '../../config/backend';
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

export default function WalletScreen() {
  const { colors, isDark } = useTheme();
  const { appUser, user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<GoldPlan[]>([]);
  const [loading, setLoading] = useState<string | null>(null); // Plan ID being purchased
  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [selectedPlanForWebView, setSelectedPlanForWebView] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToGoldPlans((fetchedPlans) => {
      setPlans(fetchedPlans);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data is synced via listener, so we just add a delay for feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handlePurchase = async (plan: GoldPlan) => {
    if (!user || !appUser) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    try {
      setLoading(plan.id);

      // 1. Create order on our backend
      const response = await fetch(`${BACKEND_URL}/api/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.actualPrice }),
      });

      if (!response.ok) throw new Error('Failed to create order');
      const order = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        description: `Purchase ${plan.coins} Gold`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        name: 'CallApp',
        order_id: order.id,
        prefill: {
          email: `${appUser.phone}@callapp.com`,
          contact: appUser.phone,
          name: appUser.name
        },
        theme: { color: '#FF4D67' }
      };

      // Use Native Razorpay if available, otherwise fallback to WebView
      if (RazorpayCheckout) {
        const data = await RazorpayCheckout.open(options);
        await handlePaymentSuccess(plan, (data as any).razorpay_payment_id, (data as any).razorpay_order_id);
      } else {
        // WebView Fallback for Expo Go
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body style="background-color: transparent;">
              <script>
                const options = {
                  "key": "${RAZORPAY_KEY_ID}",
                  "amount": "${order.amount}",
                  "currency": "INR",
                  "name": "CallApp",
                  "description": "Purchase ${plan.coins} Gold",
                  "image": "https://i.imgur.com/3g7nmJC.png",
                  "order_id": "${order.id}",
                  "prefill": {
                    "name": "${appUser.name}",
                    "email": "${appUser.phone}@callapp.com",
                    "contact": "${appUser.phone}"
                  },
                  "theme": { "color": "#FF4D67" },
                  "handler": function (response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      status: 'success',
                      payment_id: response.razorpay_payment_id,
                      order_id: response.razorpay_order_id,
                      signature: response.razorpay_signature
                    }));
                  },
                  "modal": {
                    "ondismiss": function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
                    }
                  }
                };
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response){
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'failed',
                    error: response.error
                  }));
                });
                rzp.open();
              </script>
            </body>
          </html>
        `;
        setCheckoutUrl(html);
        setSelectedPlanForWebView(plan);
        setShowWebView(true);
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error?.code !== 2) { // User didn't cancel
        Alert.alert('Payment Failed', error.description || 'Something went wrong. Please try again.');
      }
    } finally {
      if (RazorpayCheckout) setLoading(null);
    }
  };

  const handlePaymentSuccess = async (plan: GoldPlan, paymentId: string, orderId: string) => {
    if (!user || !appUser) return;

    try {
      const totalCoins = plan.coins;
      const newBalance = (appUser.coins || 0) + totalCoins;

      // Update User Balance
      await updateUserBalance(user.uid, newBalance);

      // Record Transaction
      await recordTransaction({
        userId: user.uid,
        amountInRupees: plan.actualPrice,
        coins: totalCoins,
        type: 'deposit',
        status: 'success',
        timestamp: Timestamp.now(),
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        planId: plan.id
      } as any);

      Alert.alert('Success', `Successfully added ${totalCoins} gold to your wallet!`);
    } catch (error) {
      console.error("Balance update error:", error);
      Alert.alert('Error', 'Payment was successful but balance update failed. Please contact support.');
    }
  };

  const onWebViewMessage = async (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    setShowWebView(false);
    setLoading(null);

    if (data.status === 'success') {
      await handlePaymentSuccess(selectedPlanForWebView, data.payment_id, data.order_id);
    } else if (data.status === 'failed') {
      Alert.alert('Payment Failed', data.error?.description || 'Payment was unsuccessful');
    }

    setSelectedPlanForWebView(null);
    setCheckoutUrl(null);
  };

  const renderItem = ({ item }: { item: GoldPlan }) => {
    const discount = item.originalPrice ? Math.round(((item.originalPrice - item.actualPrice) / item.originalPrice) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.cardWrapperGrid}
        activeOpacity={0.8}
        onPress={() => handlePurchase(item)}
        disabled={!!loading}
      >
        <LinearGradient
          colors={item.isPopular ? ['#FFD700', '#F59E0B'] : [colors.card, colors.card]}
          style={[styles.cardBorderGrid, item.isPopular && styles.cardBorderActive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.cardInnerGrid, { backgroundColor: colors.card }]}>
            {(item.isPopular || item.tag) && (
              <View style={[styles.popularBadgeGrid, item.tag && !item.isPopular ? { backgroundColor: '#FF4D67' } : null]}>
                <Text style={[styles.popularText, item.tag && !item.isPopular ? { color: '#fff' } : null]}>
                  {item.tag ? item.tag.toUpperCase() : 'POPULAR'}
                </Text>
              </View>
            )}

            <View style={styles.coinHeaderGrid}>
              <View style={[styles.coinOutlineSmall, { borderColor: '#FFD700' }]}>
                <FontAwesome5 name="coins" size={16} color="#FFD700" />
              </View>
              <Text style={[styles.coinAmountGrid, { color: colors.text }]}>{item.coins.toLocaleString()}</Text>
            </View>

            <View style={styles.priceSection}>
              {item.originalPrice > item.actualPrice && (
                <View style={styles.discountRow}>
                  <Text style={styles.originalPriceTextMini}>₹{item.originalPrice}</Text>
                  <View style={styles.discountBadgeMini}>
                    <Text style={styles.discountTextMini}>-{Math.round(((item.originalPrice - item.actualPrice) / item.originalPrice) * 100)}%</Text>
                  </View>
                </View>
              )}

              <LinearGradient
                colors={item.isPopular ? ['#FFD700', '#F59E0B'] : isDark ? ['#2A2D3C', '#2A2D3C'] : ['#f3f4f6', '#f3f4f6']}
                style={styles.priceButtonGridSmall}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.priceTextGridSmall, { color: isDark && !item.isPopular ? '#fff' : item.isPopular ? '#000' : colors.text }]}>
                  {loading === item.id ? (
                    <ActivityIndicator size="small" color={item.isPopular ? '#000' : '#fff'} />
                  ) : (
                    `₹${item.actualPrice.toLocaleString()}`
                  )}
                </Text>
              </LinearGradient>

              {item.talktime ? (
                <View style={styles.talktimeContainer}>
                  <FontAwesome5 name="clock" size={8} color="#8B5CF6" />
                  <Text style={styles.talktimeTextSmall}>{item.talktime} Talktime</Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#FF4D67', '#A11643']} style={styles.headerBackground} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(men)/tx-history')}>
                <Ionicons name="time-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceMain}>
              <View style={[styles.coinOutline, { borderColor: '#fff', width: 32, height: 32, marginRight: 10, marginBottom: 12 }]}>
                <FontAwesome5 name="coins" size={16} color="#fff" />
              </View>
              <Text style={styles.balanceAmount}>{appUser?.coins?.toLocaleString() || '0'}</Text>
            </View>
            <Text style={styles.balanceSubtext}>Get more gold to keep the conversation going!</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Gold Shop</Text>
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed" size={14} color="#4CAF50" />
          <Text style={styles.secureText}>Secure Buy</Text>
        </View>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContentGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF4D67"
            colors={['#FF4D67']}
          />
        }
      />

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>Secure Checkout</Text>
            <TouchableOpacity onPress={() => {
              setShowWebView(false);
              setLoading(null);
            }}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {checkoutUrl && (
            <WebView
              source={{ html: checkoutUrl }}
              onMessage={onWebViewMessage}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              originWhitelist={['*']}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0e',
  },
  headerContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 0,
    marginBottom: 10,
  },
  headerBackground: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historyBtn: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  balanceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  balanceSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  secureText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  listContentGrid: {
    paddingHorizontal: 12,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  cardWrapperGrid: {
    width: COLUMN_WIDTH,
  },
  cardBorderGrid: {
    borderRadius: 20,
    padding: 1.5,
  },
  cardBorderActive: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardInnerGrid: {
    borderRadius: 18.5,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadgeGrid: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  popularText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  coinHeaderGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
  },
  coinOutlineSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  coinAmountGrid: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  coinsLabelGrid: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.6,
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
  },
  priceSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  originalPriceTextMini: {
    color: '#666',
    fontSize: 10,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountBadgeMini: {
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountTextMini: {
    color: '#FF4D67',
    fontSize: 9,
    fontWeight: '800',
  },
  priceButtonGridSmall: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  priceTextGridSmall: {
    fontSize: 16,
    fontWeight: '900',
  },
  talktimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  talktimeTextSmall: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coinOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
});
