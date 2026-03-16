import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../services/firebaseService';

const { width, height } = Dimensions.get('window');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export default function Login() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setMockUser } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Required', 'Please enter your phone number to continue');
      return;
    }

    setLoading(true);

    try {
      // For mock testing, we just transition to the 6-digit screen
      console.log('Transitioning to mock OTP screen for:', phoneNumber);
      setIsVerifying(true);
    } catch (err: any) {
      console.error('Mock OTP Init Error:', err);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);

    try {
      // Simulate/Mock login as earlier requested
      console.log('Verifying mock OTP:', code);

      // Use deterministic mock IDs for common test numbers, 
      // otherwise generate a unique mock ID based on the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const mockId = cleanPhone.includes('1234567890') 
        ? 'mock_user_man_123' 
        : cleanPhone.includes('9876543210')
          ? 'mock_user_woman_456'
          : `mock_${cleanPhone}`;

      await setMockUser(mockId);

      const existingData = await getUserData(mockId);
      if (existingData?.isProfileComplete) {
        router.replace(existingData.role === 'man' ? '/(men)' : '/(women)');
      } else {
        router.replace('/role');
      }
    } catch (err: any) {
      console.error('Mock Verification Error:', err);
      Alert.alert('Verification Failed', 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.logoContainer, { backgroundColor: '#FF4D67' }]}>
        <Ionicons name="call" size={32} color="#fff" />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {isVerifying ? 'Verification' : 'Get Started'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>
        {isVerifying
          ? `Enter the 6-digit code sent to ${phoneNumber}`
          : 'Enter your phone number to join our community.'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <LinearGradient
        colors={isDark ? ['rgba(15,15,19,0.7)', 'rgba(15,15,19,0.9)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {renderHeader()}

          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
            {!isVerifying ? (
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                  <View style={styles.countryCode}>
                    <Text style={[styles.countryText, { color: colors.text }]}>+91</Text>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  </View>
                  <TextInput
                    autoCapitalize="none"
                    value={phoneNumber}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.subText + '80'}
                    onChangeText={setPhoneNumber}
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="phone-pad"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainButton, (!phoneNumber || loading) && styles.buttonDisabled]}
                  onPress={onSendOTP}
                  disabled={!phoneNumber || loading}
                >
                  <LinearGradient
                    colors={['#FF4D67', '#FF8A9B']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Continue</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.subText} style={styles.inputIcon} />
                  <TextInput
                    value={code}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.subText + '80'}
                    onChangeText={setCode}
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainButton, (code.length < 6 || loading) && styles.buttonDisabled]}
                  onPress={onVerifyOTP}
                  disabled={code.length < 6 || loading}
                >
                  <LinearGradient
                    colors={['#FF4D67', '#FF8A9B']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => setIsVerifying(false)}
                >
                  <Text style={[styles.resendText, { color: colors.subText }]}>
                    Wrong number? <Text style={{ color: '#FF4D67', fontWeight: '600' }}>Change</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </BlurView>

          <Text style={[styles.termsText, { color: colors.subText }]}>
            By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    top: -width * 0.5,
    left: -width * 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: 'rgba(255, 138, 155, 0.1)',
    bottom: -width * 0.2,
    right: -width * 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  glassCard: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    marginBottom: 32,
  },
  inputWrapper: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 20,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  divider: {
    width: 1,
    height: 24,
    marginRight: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  mainButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 30,
  },
  link: {
    color: '#FF4D67',
    fontWeight: '600',
  },
});
