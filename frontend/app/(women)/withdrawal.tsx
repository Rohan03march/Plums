import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, Dimensions, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, Layout, ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateDoc, doc, increment, deleteField } from 'firebase/firestore';
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
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCoins, setPendingCoins] = useState(0);

  const [isAddingMethod, setIsAddingMethod] = useState(false);

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const TDS_RATE = 0.05; // 5% TDS
  const breakdown = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const tds = numAmount * TDS_RATE;
    const net = numAmount - tds;
    const coins = Math.round(numAmount * 10);
    return {
      gross: numAmount,
      tds: parseFloat(tds.toFixed(2)),
      net: parseFloat(net.toFixed(2)),
      coins
    };
  }, [amount]);

  const hasSavedDetails = method === 'upi' ? !!appUser?.savedUpiId : !!appUser?.savedBankDetails;

  // Hydrate saved details once when appUser is loaded
  useEffect(() => {
    if (appUser && !isAddingMethod) {
      if (appUser.savedUpiId) setUpiId(appUser.savedUpiId);
      if (appUser.savedBankDetails) {
        setBankName(appUser.savedBankDetails.bankName || '');
        setAccountNumber(appUser.savedBankDetails.accountNumber || '');
        setIfscCode(appUser.savedBankDetails.ifscCode || '');
        setAccountHolder(appUser.savedBankDetails.accountHolder || '');
      }
    }
  }, [appUser?.id, method]);

  const savePayoutDetails = async () => {
    if (!appUser?.id) return;

    if (method === 'upi' && !upiId.includes('@')) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }
    if (method === 'bank' && (!bankName || !accountNumber || !ifscCode || !accountHolder)) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firebaseDb, 'Users', appUser.id);
      const updates: any = {};

      if (method === 'upi') {
        updates.savedUpiId = upiId;
      } else {
        updates.savedBankDetails = { bankName, accountNumber, ifscCode, accountHolder };
      }

      await updateDoc(userRef, updates);
      Alert.alert('Success', 'Payout details saved successfully');
      setIsAddingMethod(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save payout details');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePayoutDetails = async () => {
    if (!appUser?.id) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to remove this ${method === 'upi' ? 'UPI ID' : 'Bank Account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userRef = doc(firebaseDb, 'Users', appUser.id);
              const updates: any = {};
              if (method === 'upi') {
                updates.savedUpiId = deleteField();
                setUpiId('');
              } else {
                updates.savedBankDetails = deleteField();
                setBankName(''); setAccountNumber(''); setIfscCode(''); setAccountHolder('');
              }
              await updateDoc(userRef, updates);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete payout details');
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (!appUser?.id) return;
    const unsubscribe = subscribeToPendingPayout(appUser.id, (coins) => {
      setPendingCoins(coins);
    });

    return () => unsubscribe();
  }, [appUser?.id]);

  const totalCoins = appUser?.earningBalance || 0;
  const rupeeValue = appUser?.rupeeBalance || 0;
  const minimumWithdrawal = 50;

  const handleWithdraw = async () => {
    const trimmedAmount = (amount || '').trim();
    const reqAmount = parseFloat(trimmedAmount || '0');

    // 100% Reliable: Use Gold as the source of truth (integers)
    const currentGold = appUser?.earningBalance || 0;
    const currentRupee = appUser?.rupeeBalance || 0;
    const neededGold = Math.round(reqAmount * 10);
    const availableRupees = currentGold / 10;

    console.log("[Withdrawal Debug]", {
      userId: appUser?.id,
      typedAmount: trimmedAmount,
      reqAmount,
      neededGold,
      currentGold,
      currentRupee,
      calculatedAvailRupees: availableRupees
    });

    if (!reqAmount || reqAmount < minimumWithdrawal) {
      Alert.alert('Error', `Minimum withdrawal amount is ₹${minimumWithdrawal}`);
      return;
    }

    if (neededGold > currentGold) {
      Alert.alert('Insufficient Balance',
        `Required: ${neededGold} Gold (₹${reqAmount.toFixed(2)})\n` +
        `Available: ${currentGold} Gold (₹${availableRupees.toFixed(2)})\n\n` +
        `Debug Info: ${JSON.stringify({ g: currentGold, r: currentRupee })}`
      );
      return;
    }

    // We deduct exactly the coins needed for this amount
    const coinsToDeduct = neededGold;
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

      // Balance deduction is now handled exclusively by the backend API
      // to avoid double deduction and ensure atomic transactions.


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
              <Text style={styles.balanceRs}>₹ {(totalCoins / 10).toFixed(2)}</Text>
              <View style={styles.miniBreakdown}>
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>Available Gold: {totalCoins.toLocaleString()}</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniItem}>
                  <Text style={styles.miniLabel}>Verified: {appUser?.displayName?.split(' ')[0]}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Minimum withdrawal is ₹{minimumWithdrawal}</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {pendingCoins > 0 ? (
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.pendingHub}>
          <View style={styles.pendingHubIcon}>
            <LinearGradient
              colors={['#FFD700', '#FFA000']}
              style={styles.pendingHubIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="time" size={32} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={[styles.pendingHubTitle, { color: colors.text }]}>Withdrawal in Progress</Text>
          <Text style={[styles.pendingHubAmount, { color: isDark ? '#fff' : '#000' }]}>₹ {(pendingCoins / 10).toFixed(2)}</Text>

          <View style={[styles.pendingHubCard, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.card }]}>
            <View style={styles.pendingHubCardInner}>
              <View style={styles.pendingHubStatusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>PENDING PROCESSING</Text>
              </View>

              <Text style={[styles.pendingHubMessage, { color: colors.subText }]}>
                We are currently processing your request. The amount will be transferred to your account within 24 hours.
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>

            <Text style={[styles.sectionHeading, { color: colors.subText }]}>WITHDRAWAL METHOD</Text>
            <View style={[
              styles.methodToggle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' },
              pendingCoins > 0 && { opacity: 0.6 }
            ]}>
              <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
              <Pressable
                style={styles.toggleBtn}
                onPress={() => pendingCoins === 0 && handleMethodToggle('upi')}
                disabled={pendingCoins > 0}
              >
                <Text style={[styles.toggleText, { color: method === 'upi' ? '#fff' : colors.subText, opacity: method === 'upi' ? 1 : 0.6 }]}>
                  <Ionicons name="flash" size={14} color={method === 'upi' ? '#fff' : colors.subText} /> UPI ID
                </Text>
              </Pressable>
              <Pressable
                style={styles.toggleBtn}
                onPress={() => pendingCoins === 0 && handleMethodToggle('bank')}
                disabled={pendingCoins > 0}
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
                    style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    editable={pendingCoins === 0}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const maxAmount = (totalCoins / 10).toFixed(2);
                      setAmount(maxAmount);
                    }}
                    style={styles.maxBtn}
                  >
                    <Text style={styles.maxBtnText}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {method === 'upi' ? (
                <Animated.View entering={FadeInRight.duration(400)} key="upi-section">
                  {appUser?.savedUpiId && !isAddingMethod ? (
                    <View style={[styles.savedCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                      <View style={styles.savedCardIcon}>
                        <Ionicons name="flash" size={24} color="#FFD700" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.savedCardLabel, { color: colors.subText }]}>SAVED UPI ID</Text>
                        <Text style={[styles.savedCardValue, { color: colors.text }]}>{appUser.savedUpiId}</Text>
                      </View>
                      <View style={styles.methodActions}>
                        <TouchableOpacity onPress={() => setIsAddingMethod(true)} style={styles.iconBtn}>
                          <Ionicons name="pencil" size={18} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={deletePayoutDetails} style={[styles.iconBtn, { backgroundColor: 'rgba(255, 77, 103, 0.1)' }]}>
                          <Ionicons name="trash-outline" size={18} color="#FF4D67" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>UPI ID</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                        <TextInput
                          style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                          placeholder="username@bank"
                          placeholderTextColor="#666"
                          value={upiId}
                          onChangeText={setUpiId}
                          autoCapitalize="none"
                          editable={pendingCoins === 0}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={savePayoutDetails}
                        style={styles.saveDetailsBtn}
                        disabled={isSaving}
                      >
                        {isSaving ? <ActivityIndicator size="small" color="#FF4D67" /> : <Text style={styles.saveDetailsBtnText}>+ ADD UPI ID</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInRight.duration(400)} key="bank-section">
                  {appUser?.savedBankDetails && !isAddingMethod ? (
                    <View style={[styles.savedCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                      <View style={styles.savedCardIcon}>
                        <Ionicons name="business" size={24} color="#FF4D67" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.savedCardLabel, { color: colors.subText }]}>SAVED BANK ACCOUNT</Text>
                        <Text style={[styles.savedCardValue, { color: colors.text }]}>
                          {appUser.savedBankDetails.bankName} • {appUser.savedBankDetails.accountNumber.slice(-4).padStart(appUser.savedBankDetails.accountNumber.length, '*')}
                        </Text>
                        <Text style={[styles.savedCardSub, { color: colors.subText }]}>{appUser.savedBankDetails.accountHolder}</Text>
                      </View>
                      <View style={styles.methodActions}>
                        <TouchableOpacity onPress={() => setIsAddingMethod(true)} style={styles.iconBtn}>
                          <Ionicons name="pencil" size={18} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={deletePayoutDetails} style={[styles.iconBtn, { backgroundColor: 'rgba(255, 77, 103, 0.1)' }]}>
                          <Ionicons name="trash-outline" size={18} color="#FF4D67" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.bankFields}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Account Holder Name</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                            placeholder="Full Name"
                            placeholderTextColor="#666"
                            value={accountHolder}
                            onChangeText={setAccountHolder}
                            editable={pendingCoins === 0}
                          />
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bank Name</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                            placeholder="e.g. HDFC Bank"
                            placeholderTextColor="#666"
                            value={bankName}
                            onChangeText={setBankName}
                            editable={pendingCoins === 0}
                          />
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Account Number</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                            placeholder="000000000000"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            editable={pendingCoins === 0}
                          />
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>IFSC Code</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1E1E24' : '#F8FAFC', borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.input, { color: colors.text }, pendingCoins > 0 && { opacity: 0.5 }]}
                            placeholder="IFSC Code"
                            placeholderTextColor="#666"
                            autoCapitalize="characters"
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            editable={pendingCoins === 0}
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={savePayoutDetails}
                        style={styles.saveDetailsBtn}
                        disabled={isSaving}
                      >
                        {isSaving ? <ActivityIndicator size="small" color="#FF4D67" /> : <Text style={styles.saveDetailsBtnText}>+ ADD BANK DETAILS</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              )}

              {parseFloat(amount) > 0 && (
                <Animated.View
                  entering={FadeInDown.duration(800).springify()}
                  style={[styles.breakdownContainer, { borderColor: colors.border }]}
                >
                  <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                  <View style={styles.breakdownInner}>
                    <View style={styles.breakdownHeader}>
                      <View style={[styles.receiptIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
                        <Ionicons name="receipt" size={20} color={isDark ? '#fff' : '#000'} />
                      </View>
                      <View>
                        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Payout Summary</Text>
                        <Text style={[styles.breakdownSub, { color: colors.subText }]}>Estimates based on current rates</Text>
                      </View>
                    </View>

                    <View style={styles.breakdownBody}>
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.subText }]}>Requested Amount</Text>
                        <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{breakdown.gross.toFixed(2)}</Text>
                      </View>

                      <View style={styles.breakdownRow}>
                        <View style={styles.labelWithInfo}>
                          <Text style={[styles.breakdownLabel, { color: colors.subText }]}>TDS Deduction</Text>
                          <View style={styles.tdsBadge}>
                            <Text style={styles.tdsBadgeText}>5%</Text>
                          </View>
                        </View>
                        <Text style={[styles.breakdownValue, { color: '#FF4D67' }]}>- ₹{breakdown.tds.toFixed(2)}</Text>
                      </View>

                      <View style={styles.dashedContainer}>
                        <View style={[styles.dashedLine, { borderColor: colors.border }]} />
                      </View>

                      <View style={styles.breakdownNetRow}>
                        <View>
                          <Text style={[styles.breakdownLabel, { color: colors.text, fontWeight: '800' }]}>Estimated Payout</Text>
                          <Text style={[styles.netAmountCaption, { color: colors.subText }]}>Credited to your account</Text>
                        </View>
                        <View style={styles.netAmountContainer}>
                          <Text style={[styles.breakdownNetValue, { color: '#00C853' }]}>₹{breakdown.net.toFixed(2)}</Text>
                        </View>
                      </View>

                      <View style={[styles.coinInfoBox, { backgroundColor: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(255,215,0,0.05)', borderColor: isDark ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)' }]}>
                        <View style={styles.coinInfoIcon}>
                          <MaterialCommunityIcons name="database-arrow-down" size={18} color="#FFD700" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.coinInfoHeading, { color: isDark ? '#FFD700' : '#B8860B' }]}>FUNDS DEDUCTION</Text>
                          <Text style={[styles.coinInfoText, { color: colors.text }]}>
                            <Text style={{ fontWeight: '900', color: isDark ? '#fff' : '#000' }}>{breakdown.coins}</Text> Gold coins will be deducted from your total balance.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Guidelines Section */}
              <View style={[styles.guidelinesContainer, { backgroundColor: isDark ? 'rgba(255, 77, 103, 0.05)' : '#FFF5F6', borderColor: isDark ? 'rgba(255, 77, 103, 0.2)' : '#FFE4E8' }]}>
                <View style={styles.guidelinesHeader}>
                  <Ionicons name="information-circle" size={18} color="#FF4D67" />
                  <Text style={styles.guidelinesTitle}>PAYOUT GUIDELINES</Text>
                </View>
                <View style={styles.guidelineRow}>
                  <View style={styles.guidelineBullet} />
                  <Text style={[styles.guidelineText, { color: colors.subText }]}>Amount will be transferred within <Text style={{ color: colors.text, fontWeight: '800' }}>24 Hours</Text>.</Text>
                </View>
                <View style={styles.guidelineRow}>
                  <View style={styles.guidelineBullet} />
                  <Text style={[styles.guidelineText, { color: colors.subText }]}><Text style={{ color: colors.text, fontWeight: '800' }}>5% TDS</Text> will be deducted as per government regulations.</Text>
                </View>
                <View style={styles.guidelineRow}>
                  <View style={styles.guidelineBullet} />
                  <Text style={[styles.guidelineText, { color: colors.subText }]}>You cannot request a new withdrawal while one is <Text style={{ color: '#FF4D67', fontWeight: '800' }}>PENDING</Text>.</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, { opacity: (loading || pendingCoins > 0) ? 0.7 : 1 }]}
                onPress={handleWithdraw}
                disabled={loading || pendingCoins > 0}
              >
                <LinearGradient
                  colors={pendingCoins > 0 ? ['#8E8E93', '#AEAEB2'] : ['#FF4D67', '#FF7E8D']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>
                        {pendingCoins > 0
                          ? 'Request Pending...'
                          : parseFloat(amount) > 0
                            ? `Withdraw ₹${breakdown.net.toFixed(2)}`
                            : 'Request Withdraw Now'}
                      </Text>
                      <Ionicons name={pendingCoins > 0 ? "time-outline" : "arrow-forward"} size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
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
  maxBtn: { backgroundColor: 'rgba(255, 77, 103, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  maxBtnText: { color: '#FF4D67', fontSize: 12, fontWeight: '800' },
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
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 16,
    marginBottom: 8,
  },
  savedCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  savedCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  savedCardValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  savedCardSub: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    opacity: 0.8,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveDetailsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 103, 0.08)',
    marginTop: 4,
  },
  saveDetailsBtnText: {
    color: '#FF4D67',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Breakdown Styles
  breakdownContainer: {
    borderRadius: 32,
    borderWidth: 1.5,
    marginVertical: 12,
    overflow: 'hidden',
  },
  breakdownInner: { padding: 24, gap: 20 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  receiptIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  breakdownTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  breakdownSub: { fontSize: 11, fontWeight: '600', opacity: 0.7 },
  breakdownBody: { gap: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownNetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  breakdownLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  breakdownValue: { fontSize: 16, fontWeight: '800' },
  breakdownNetValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  netAmountCaption: { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  netAmountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 200, 83, 0.05)',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  dashedContainer: { height: 1.5, marginVertical: 10, overflow: 'hidden' },
  dashedLine: { height: 2, borderWidth: 1, borderStyle: 'dashed', borderRadius: 1 },
  labelWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tdsBadge: { backgroundColor: 'rgba(255, 77, 103, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tdsBadgeText: { color: '#FF4D67', fontSize: 10, fontWeight: '900' },
  coinInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    marginTop: 8,
    borderWidth: 1.5,
  },
  coinInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)'
  },
  coinInfoHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  coinInfoText: { fontSize: 12, fontWeight: '700', lineHeight: 20 },

  // Pending Hub Styles
  pendingHub: {
    paddingHorizontal: 12,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  pendingHubIcon: {
    width: 80,
    height: 80,
    borderRadius: 30,
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  pendingHubIconGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingHubTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pendingHubAmount: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 32,
  },
  pendingHubCard: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pendingHubCardInner: {
    padding: 24,
    alignItems: 'center',
  },
  pendingHubStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  statusText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pendingHubMessage: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  pendingHubDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  pendingHubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDivider: {
    width: 1,
    height: 12,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  guidelinesContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
    gap: 12,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF4D67',
    letterSpacing: 1,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guidelineBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D67',
    marginTop: 6,
  },
  guidelineText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
