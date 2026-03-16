import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment, Timestamp } from 'firebase/firestore';
import { firebaseDb } from '../../config/firebase';
import { BACKEND_URL } from '../../config/backend';

export default function Withdrawal() {
  const { colors, isDark } = useTheme();
  const { appUser } = useAuth();
  
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The AuthContext handles user subscription, so we just simulate a delay
    // to give feedback to the user that a "refresh" happened.
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const totalCoins = appUser?.coins || 0;
  const rupeeValue = totalCoins / 10;
  const minimumWithdrawal = 50;

  const handleWithdraw = async () => {
    const reqAmount = parseInt(amount);
    const coinsToDeduct = reqAmount * 10;
    
    // Validation
    if (!reqAmount || reqAmount < minimumWithdrawal) {
      Alert.alert('Error', `Minimum withdrawal amount is ₹${minimumWithdrawal}`);
      return;
    }
    if (coinsToDeduct > totalCoins) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (method === 'upi' && !upiId.includes('@')) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }

    if (method === 'bank') {
      if (!bankName || !accountNumber || !ifscCode || !accountHolder) {
        Alert.alert('Error', 'Please fill all bank details');
        return;
      }
    }


    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/payouts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: appUser?.id,
          userName: appUser?.displayName || appUser?.name,
          userAvatar: appUser?.avatar,
          userEmail: appUser?.phone,
          amount: reqAmount,
          coins: coinsToDeduct,
          method: method,
          details: method === 'upi' ? { upiId } : { bankName, accountNumber, ifscCode, accountHolder }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }
      
      Alert.alert('Success', `Withdrawal request for ₹${reqAmount} submitted successfully. Your balance has been updated.`);
      setAmount('');
      setUpiId('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setAccountHolder('');
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bg }]} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Premium Balance Card */}
      <View style={styles.cardGlowContainer}>
        <LinearGradient colors={isDark ? ['#FF4D67', '#FF8A9B'] : ['#EC4899', '#F472B6']} style={styles.premiumCard} start={{x:0,y:0}} end={{x:1,y:1}}>
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
            <Text style={styles.balanceRs}>₹ {rupeeValue}</Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>Minimum withdrawal is ₹{minimumWithdrawal}</Text>
            <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </View>

      {/* Method Selection */}
      <View style={styles.methodToggle}>
        <TouchableOpacity 
          style={[styles.toggleBtn, method === 'upi' && styles.toggleBtnActive, { borderColor: colors.border }]} 
          onPress={() => setMethod('upi')}
        >
          <Ionicons name="qr-code-outline" size={20} color={method === 'upi' ? '#fff' : colors.subText} />
          <Text style={[styles.toggleText, { color: method === 'upi' ? '#fff' : colors.subText }]}>UPI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, method === 'bank' && styles.toggleBtnActive, { borderColor: colors.border }]} 
          onPress={() => setMethod('bank')}
        >
          <Ionicons name="business-outline" size={20} color={method === 'bank' ? '#fff' : colors.subText} />
          <Text style={[styles.toggleText, { color: method === 'bank' ? '#fff' : colors.subText }]}>Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Withdrawal Form */}
      <View style={styles.formContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Request Payout</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subText }]}>Amount (INR)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.currencyPrefix, { color: colors.text }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Minimum 50 INR"
              placeholderTextColor={colors.subText}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.subText }]}>Min. ₹{minimumWithdrawal} | (10 Coins = 1 INR)</Text>
        </View>

        {method === 'upi' ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subText }]}>UPI ID / VPA</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="card" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 9876543210@ybl"
                placeholderTextColor={colors.subText}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
            </View>
          </View>
        ) : (
          <View style={styles.bankFields}>
             <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Account Holder Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Full Name as per Bank"
                  placeholderTextColor={colors.subText}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Bank Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={colors.subText}
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Account Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Bank Account Number"
                  placeholderTextColor={colors.subText}
                  keyboardType="number-pad"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>IFSC Code</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="IFSC Code"
                  placeholderTextColor={colors.subText}
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleWithdraw} activeOpacity={0.8} disabled={loading}>
          <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.buttonGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Submit Payout Request</Text>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
    gap: 30,
  },
  cardGlowContainer: {
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  premiumCard: {
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  coinText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  balanceContainer: {
    marginBottom: 30,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceRs: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardFooterText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  methodToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  toggleBtnActive: {
    backgroundColor: '#FF4D67',
    borderColor: '#FF4D67',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bankFields: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    height: 64,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    width: 24,
  },
  currencyPrefix: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  button: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
