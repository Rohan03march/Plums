import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FirebaseRecaptcha from '../components/FirebaseRecaptcha';
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../services/firebaseService';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const recaptchaRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (isVerifying && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isVerifying, timer]);

  useEffect(() => {
    if (recaptchaToken && phoneNumber && !isVerifying && !loading) {
      onSendOTP();
    }
  }, [recaptchaToken]);

  const onSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Required', 'Please enter your phone number to continue');
      return;
    }

    setLoading(true);

    try {
      if (!recaptchaToken) {
        recaptchaRef.current?.verify();
        setLoading(false);
        return;
      }

      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        `+91${phoneNumber}`,
        {
          type: 'recaptcha',
          verify: async () => recaptchaToken,
          reset: () => recaptchaRef.current?.reset(),
          _reset: () => recaptchaRef.current?.reset(),
        } as any
      );

      setVerificationId(confirmation.verificationId);
      setIsVerifying(true);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      console.error('OTP Init Error:', err);
      let detail = 'Please check your connection and number.';
      if (err.code === 'auth/invalid-phone-number') detail = 'The phone number is invalid.';
      if (err.code === 'auth/too-many-requests') detail = 'Too many attempts. Please try again later.';
      Alert.alert('Login Error', detail);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    if (!verificationId) {
      Alert.alert('Error', 'Session expired. Please request a new OTP.');
      setIsVerifying(false);
      return;
    }
    setLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(firebaseAuth, credential);
      const firebaseUser = userCredential.user;

      const existingData = await getUserData(firebaseUser.uid);
      if (existingData?.isProfileComplete) {
        router.replace(existingData.role === 'man' ? '/(men)' : '/(women)');
      } else {
        router.replace('/role');
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      let message = 'The code you entered is invalid. Please try again.';
      if (err.code === 'auth/code-expired') message = 'This code has expired. Please request a new one.';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0F0F13' }]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#170b22', '#0f0f13', '#0d0d0f']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.ambientGlow} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header Branding */}
          <Animated.View entering={FadeInDown.duration(1000)} style={styles.header}>
            <Text style={styles.brandName}>Plums</Text>
            <Text style={styles.subtitle}>
              {isVerifying ? 'VERIFY OTP' : 'WELCOME BACK'}
            </Text>
          </Animated.View>

          <View style={styles.formArea}>
            <FirebaseRecaptcha
              ref={recaptchaRef}
              firebaseConfig={firebaseConfig}
              onVerify={(token) => setRecaptchaToken(token)}
            />

            {!isVerifying ? (
              <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                <View style={[styles.inputBox, { borderColor: colors.border }]}>
                  <View style={styles.countryBadge}>
                    <Text style={styles.countryText}>+91</Text>
                    <View style={[styles.inputPipe, { backgroundColor: colors.border }]} />
                  </View>
                  <TextInput
                    value={phoneNumber}
                    placeholder="Phone Number"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    onChangeText={setPhoneNumber}
                    style={styles.textInput}
                    keyboardType="phone-pad"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainBtn, (!phoneNumber || loading) && styles.btnDisabled]}
                  onPress={onSendOTP}
                  disabled={!phoneNumber || loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>CONTINUE</Text>}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp.duration(800)}>
                <Text style={styles.otpSentTo}>OTP is sent to +91 {phoneNumber}</Text>
                <View style={[styles.inputBox, { borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 15 }} />
                  <TextInput
                    value={code}
                    placeholder="Verification Code"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    onChangeText={setCode}
                    style={styles.textInput}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainBtn, (code.length < 6 || loading) && styles.btnDisabled]}
                  onPress={onVerifyOTP}
                  disabled={code.length < 6 || loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>VERIFY & SIGN IN</Text>}
                </TouchableOpacity>

                <View style={styles.resendArea}>
                  {timer > 0 ? (
                    <Text style={styles.resendTimer}>Resend in 00:{timer < 10 ? `0${timer}` : timer}</Text>
                  ) : (
                    <TouchableOpacity onPress={onSendOTP}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setIsVerifying(false)} style={{ marginTop: 12 }}>
                    <Text style={styles.changeLink}>Change phone number</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termLink}>Terms</Text> and{' '}
              <Text style={styles.termLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(255, 45, 85, 0.03)',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 45, 85, 0.15)',
    filter: 'blur(15px)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 8,
  },
  formArea: {
    width: '100%',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 10,
  },
  inputPipe: {
    width: 1,
    height: 24,
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  mainBtn: {
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnTxt: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  btnDisabled: {
    opacity: 0.5,
    elevation: 0,
  },
  resendArea: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendTimer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLink: {
    color: '#FF2D55',
    fontSize: 15,
    fontWeight: '700',
  },
  changeLink: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  otpSentTo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  terms: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
  },
  termLink: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
});
