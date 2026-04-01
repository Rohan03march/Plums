import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { updateUserProfile } from '../services/firebaseService';

const { width } = Dimensions.get('window');

const MALE_AVATARS = [
  require('../assets/images/3d_boy_1.jpg'),
  require('../assets/images/3d_boy_2.jpg'),
  require('../assets/images/3d_boy_3.jpg'),
  require('../assets/images/3d_boy_4.jpg'),
  require('../assets/images/3d_boy_5.jpg'),
  require('../assets/images/3d_boy_6.jpg'),
  require('../assets/images/3d_boy_7.jpg'),
];

const FEMALE_AVATARS = [
  require('../assets/images/3d_avatar_1.jpg'),
  require('../assets/images/3d_avatar_2.jpg'),
  require('../assets/images/3d_avatar_3.jpg'),
  require('../assets/images/3d_avatar_4.jpg'),
  require('../assets/images/3d_avatar_5.jpg'),
  require('../assets/images/3d_avatar_6.jpg'),
  require('../assets/images/3d_avatar_7.jpg'),
];

const HOBBIES = [
  'Reading', 'Travel', 'Music', 'Coding', 'Fitness', 'Cooking', 'Gaming', 'Art', 'Photography', 'Dancing'
];

export default function Setup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialGender?: 'male' | 'female' }>();
  const { user, appUser, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [gender, setGender] = useState<'male' | 'female' | null>(params.initialGender || null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(params.initialGender ? 2 : 1); // 1: Gender, 2: Details

  useEffect(() => {
    if (displayName && !username) {
      // Auto-generate username from display name
      const generated = displayName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
      setUsername(generated);
    }
  }, [displayName]);

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(prev => prev.filter(h => h !== hobby));
    } else {
      setSelectedHobbies(prev => [...prev, hobby]);
    }
  };

  const onCompleteSetup = async () => {
    if (!displayName || !username) {
      Alert.alert('Required', 'Please fill in all details');
      return;
    }
    if (gender === 'female' && selectedHobbies.length === 0) {
      Alert.alert('Hobbies', 'Please select at least one interest');
      return;
    }

    setLoading(true);
    try {
      const avatarId = gender === 'male'
        ? `boy_${Math.floor(Math.random() * 7) + 1}`
        : `girl_${Math.floor(Math.random() * 7) + 1}`;

      if (!user) {
        Alert.alert('Session Error', 'Please log in again to continue');
        setLoading(false);
        return;
      }

      await updateUserProfile(user.uid, {
        displayName,
        username,
        role: (gender === 'male' ? 'man' : 'woman') as 'man' | 'woman',
        gender: gender as 'male' | 'female',
        avatar: avatarId,
        hobbies: gender === 'female' ? selectedHobbies : [],
        coins: gender === 'male' ? 30 : 0,
        allTimeEarnings: 0,
        videoEarnings: 0,
        audioEarnings: 0,
        giftEarnings: 0,
        totalCalls: 0,
        talkTime: 0,
        avgRating: 0,
        isProfileComplete: true,
      });

      router.replace(gender === 'male' ? '/(men)' : '/(women)');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <LinearGradient
          colors={isDark ? ['rgba(255, 77, 103, 0.15)', '#0f0f13', '#0f0f13'] : ['rgba(255, 77, 103, 0.05)', '#f8f9fa', '#f8f9fa']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <TouchableOpacity style={styles.logoutBtnTop} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4D67" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={[styles.setupTitle, { color: colors.text }]}>Choose Your Gender</Text>
          <Text style={[styles.setupSubtitle, { color: colors.subText }]}>Help us personalize your experience</Text>

          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderCard, { backgroundColor: colors.card, borderColor: gender === 'male' ? '#FF4D67' : colors.border }]}
              onPress={() => setGender('male')}
            >
              <Ionicons name="male" size={48} color={gender === 'male' ? '#FF4D67' : colors.subText} />
              <Text style={[styles.genderText, { color: colors.text }]}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderCard, { backgroundColor: colors.card, borderColor: gender === 'female' ? '#FF4D67' : colors.border }]}
              onPress={() => setGender('female')}
            >
              <Ionicons name="female" size={48} color={gender === 'female' ? '#FF4D67' : colors.subText} />
              <Text style={[styles.genderText, { color: colors.text }]}>Female</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, !gender && styles.buttonDisabled]}
            onPress={() => gender && setStep(2)}
            disabled={!gender}
          >
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={isDark ? ['rgba(255, 77, 103, 0.15)', '#0f0f13', '#0f0f13'] : ['rgba(255, 77, 103, 0.05)', '#f8f9fa', '#f8f9fa']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtnInline} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF4D67" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.setupTitle, { color: colors.text }]}>Setup Your Profile</Text>
          <Text style={[styles.setupSubtitle, { color: colors.subText }]}>Enter your details to finish</Text>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.subText} style={styles.inputIcon} />
            <TextInput
              value={displayName}
              placeholder="Display Name"
              placeholderTextColor={colors.subText + '80'}
              onChangeText={setDisplayName}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="at-outline" size={20} color={colors.subText} style={styles.inputIcon} />
            <TextInput
              value={username}
              placeholder="Username"
              placeholderTextColor={colors.subText + '80'}
              onChangeText={setUsername}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="none"
            />
          </View>

          {gender === 'female' && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { color: colors.text }]}>My Interests</Text>
              <View style={styles.hobbiesContainer}>
                {HOBBIES.map((hobby) => (
                  <TouchableOpacity
                    key={hobby}
                    onPress={() => toggleHobby(hobby)}
                    style={[
                      styles.hobbyChip,
                      {
                        backgroundColor: selectedHobbies.includes(hobby) ? '#FF4D67' : colors.card,
                        borderColor: selectedHobbies.includes(hobby) ? '#FF4D67' : colors.border
                      }
                    ]}
                  >
                    <Text style={{
                      color: selectedHobbies.includes(hobby) ? '#fff' : colors.subText,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {hobby}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (!displayName || !username) && styles.buttonDisabled]}
            onPress={onCompleteSetup}
            disabled={(!displayName || !username) || loading}
          >
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Finish Setup</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  genderCard: {
    width: (width - 60) / 2,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 30,
  },
  hobbyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  logoutBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    marginBottom: 30,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    gap: 4,
  },
  logoutText: {
    color: '#FF4D67',
    fontWeight: '700',
    fontSize: 14,
  },
});
