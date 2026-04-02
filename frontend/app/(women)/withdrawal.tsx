import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, Dimensions, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, Layout, ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateDoc, doc, increment } from 'firebase/firestore';
import { firebaseDb } from '../../config/firebase';
import { BACKEND_URL } from '../../config/backend';
import { subscribeToPendingPayout } from '../../services/firebaseService';

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

export default function Withdrawal() {
  const { colors, isDark } = useTheme();
  const { appUser } = useAuth();

  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const togglePos = useSharedValue(0);

  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPayoutPending, setIsPayoutPending] = useState(false);

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (!appUser?.id) return;
    const unsubscribe = subscribeToPendingPayout(appUser.id, (pending) => {
      setIsPayoutPending(pending);
    });
    return () => unsubscribe();
  }, [appUser?.id]);

  const totalEarned = (appUser?.audioEarnings || 0) + (appUser?.videoEarnings || 0) + (appUser?.giftEarnings || 0);
  const factor = totalEarned > 0 ? Math.min(1, (appUser?.coins || 0) / totalEarned) : 0;

  const rupeeValue = (
    ((appUser?.audioEarnings || 0) * factor * 0.14) +
    ((appUser?.videoEarnings || 0) * factor * 0.10) +
    ((appUser?.giftEarnings || 0) * factor * 0.10)
  );

  const totalCoins = appUser?.coins || 0;
  const minimumWithdrawal = 50;

  const handleWithdraw = async () => {
    const reqAmount = parseInt(amount);
    const coinsToDeduct = Math.floor((reqAmount / (rupeeValue || 1)) * totalCoins);

    if (!reqAmount || reqAmount < minimumWithdrawal) {
      Alert.alert('Error', `Minimum withdrawal amount is ₹${minimumWithdrawal}`);
      return;
    }
    if (reqAmount > rupeeValue) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    if (method === 'upi' && !upiId.includes('@')) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }
    if (method === 'bank' && (!bankName || !accountNumber || !ifscCode || !accountHolder)) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/payouts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: appUser?.id,
          userName: appUser?.displayName || appUser?.name,
          userAvatar: appUser?.avatar,
          userEmail: appUser?.phone,
          amount: reqAmount,
          coins: coinsToDeduct,
          method,
          details: method === 'upi' ? { upiId } : { bankName, accountNumber, ifscCode, accountHolder }
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit request');

      const ratio = Math.min(1, reqAmount / rupeeValue);
      const audioToSub = Math.floor((appUser?.audioEarnings || 0) * ratio);
      const videoToSub = Math.floor((appUser?.videoEarnings || 0) * ratio);
      const giftsToSub = Math.floor((appUser?.giftEarnings || 0) * ratio);

      if (appUser?.id) {
        await updateDoc(doc(firebaseDb, 'Users', appUser.id), {
          audioEarnings: increment(-audioToSub),
          videoEarnings: increment(-videoToSub),
          giftEarnings: increment(-giftsToSub),
        });
      }

      Alert.alert('Success', `Withdrawal request for ₹${reqAmount} submitted successfully.`);
      setAmount('');
      setUpiId('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setAccountHolder('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodToggle = (newMethod: 'upi' | 'bank') => {
    setMethod(newMethod);
    togglePos.value = withSpring(newMethod === 'upi' ? 0 : 1, { damping: 15 });
  };

  const toggleIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: togglePos.value * ((width - 52) / 2) }],
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
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
      <View style={styles.bgDecorations} pointerEvents="none">
        <FloatingOrb color="rgba(255, 77, 103, 0.15)" size={200} delay={0} />
        <View style={{ position: 'absolute', top: 200, left: -80 }}>
          <FloatingOrb color="rgba(156, 39, 176, 0.15)" size={250} delay={1000} />
        </View>
        <View style={{ position: 'absolute', bottom: -100, right: -50 }}>
          <FloatingOrb color="rgba(77, 124, 255, 0.1)" size={300} delay={2000} />
        </View>
      </View>

      <Animated.Text
        entering={FadeInDown.delay(100).duration(800).springify()}
        style={[styles.screenTitle, { color: colors.text }]}
      >
        Wallet & Payouts
      </Animated.Text>

      <Animated.View entering={ZoomIn.delay(300).duration(1000)} style={styles.cardGlowContainer}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.premiumCardBlur}
        >
          <LinearGradient
            colors={isDark ? ['rgba(255, 77, 103, 0.85)', 'rgba(156, 39, 176, 0.85)'] : ['rgba(236, 72, 153, 0.9)', 'rgba(244, 114, 182, 0.9)']}
            style={styles.premiumCard}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="wallet" size={24} color="#FF4D67" />
              </View>
              <View style={styles.coinBadge}>
                <FontAwesome5 name="coins" size={14} color="#FFD700" />
                <Text style={styles.coinText}>{totalCoins} Coins</Text>
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
              <Text style={styles.balanceRs}>₹ {rupeeValue.toFixed(2)}</Text>
              <View style={styles.miniBreakdown}>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>Audio: ₹{((appUser?.audioEarnings || 0) * factor * 0.14).toFixed(2)}</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>Video: ₹{((appUser?.videoEarnings || 0) * factor * 0.10).toFixed(2)}</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>Gift: ₹{((appUser?.giftEarnings || 0) * factor * 0.10).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Minimum withdrawal is ₹{minimumWithdrawal}</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
        {isPayoutPending && (
          <View style={styles.pendingBanner}>
            <View style={styles.pendingIconBg}>
              <Ionicons name="time" size={20} color="#FFD700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Transaction Processing</Text>
              <Text style={styles.pendingSub}>
                We are currently finalizing your last request. New withdrawals will be available shortly.
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionHeading, { color: colors.subText }]}>WITHDRAWAL METHOD</Text>
        <View style={[
          styles.methodToggle, 
          { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' },
          isPayoutPending && { opacity: 0.6 }
        ]}>
          <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
          <Pressable
            style={styles.toggleBtn}
            onPress={() => !isPayoutPending && handleMethodToggle('upi')}
            disabled={isPayoutPending}
          >
            <Text style={[styles.toggleText, { color: method === 'upi' ? '#fff' : colors.subText, opacity: method === 'upi' ? 1 : 0.6 }]}>
              <Ionicons name="flash" size={14} color={method === 'upi' ? '#fff' : colors.subText} /> UPI ID
            </Text>
          </Pressable>
          <Pressable
            style={styles.toggleBtn}
            onPress={() => !isPayoutPending && handleMethodToggle('bank')}
            disabled={isPayoutPending}
          >
            <Text style={[styles.toggleText, { color: method === 'bank' ? '#fff' : colors.subText, opacity: method === 'bank' ? 1 : 0.6 }]}>
              <Ionicons name="business" size={14} color={method === 'bank' ? '#fff' : colors.subText} /> Bank Transfer
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(600).duration(800).springify()}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount to Withdraw</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                editable={!isPayoutPending}
              />
            </View>
          </View>

          {method === 'upi' ? (
            <Animated.View entering={FadeInRight.duration(400)} key="upi-form" style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                  placeholder="username@bank"
                  placeholderTextColor="#666"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  editable={!isPayoutPending}
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInRight.duration(400)} key="bank-form" style={styles.bankFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                    placeholder="Full Name"
                    placeholderTextColor="#666"
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    editable={!isPayoutPending}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor="#666"
                    value={bankName}
                    onChangeText={setBankName}
                    editable={!isPayoutPending}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                    placeholder="000000000000"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    editable={!isPayoutPending}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }, isPayoutPending && { opacity: 0.5 }]}
                    placeholder="IFSC Code"
                    placeholderTextColor="#666"
                    autoCapitalize="characters"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    editable={!isPayoutPending}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.button, { opacity: (loading || isPayoutPending) ? 0.7 : 1 }]}
            onPress={handleWithdraw}
            disabled={loading || isPayoutPending}
          >
            <LinearGradient
              colors={isPayoutPending ? ['#8E8E93', '#AEAEB2'] : ['#FF4D67', '#FF7E8D']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Request Withdraw Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 150, gap: 28 },
  bgDecorations: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  blob: { position: 'absolute', opacity: 0.6 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, marginTop: 24, marginBottom: 8 },
  cardGlowContainer: {
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    borderRadius: 32,
    overflow: 'hidden'
  },
  premiumCardBlur: {
    borderRadius: 32,
    overflow: 'hidden'
  },
  premiumCard: { borderRadius: 32, padding: 24, minHeight: 230, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  coinText: { color: '#FFD700', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  balanceContainer: { marginVertical: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  balanceRs: { color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: -2 },
  balanceInfo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniBreakdown: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, alignSelf: 'flex-start' },
  miniItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniLabel: { fontSize: 12, color: '#fff', fontWeight: '700' },
  miniDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cardFooterText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  sectionHeading: { fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 4, textTransform: 'uppercase' },
  methodToggle: { flexDirection: 'row', padding: 4, borderRadius: 24, gap: 0, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  toggleBtn: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: (width - 48) / 2, // 20*2 padding + 4*2 toggle padding
    backgroundColor: '#FF4D67',
    borderRadius: 20,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  toggleText: { fontSize: 14, fontWeight: '800', flexDirection: 'row', alignItems: 'center', gap: 6 },
  formContainer: { gap: 24 },
  bankFields: { gap: 24 },
  inputGroup: { gap: 10 },
  inputLabel: { color: '#8E8E93', fontSize: 13, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    height: 68,
    paddingHorizontal: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  currencyPrefix: { fontSize: 22, fontWeight: '800', width: 28, textAlign: 'center' },
  input: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  button: { height: 68, borderRadius: 34, overflow: 'hidden', marginTop: 12, shadowColor: '#FF4D67', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 12 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: 0.5 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: 16,
    marginBottom: 20,
  },
  pendingIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingTitle: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  pendingSub: {
    color: 'rgba(255, 215, 0, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
