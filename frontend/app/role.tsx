import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react'; // Added for setLoading

import { useAuth } from '../context/AuthContext';

export default function RoleSelection() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onRoleSelect = async (selectedRole: 'man' | 'woman') => {
    if (!user || authLoading) {
      Alert.alert('Please Wait', 'Authenticating...');
      return;
    };
    setLoading(true);

    try {
      // We route to setup screen to collect details before entering the app
      router.push({
        pathname: '/setup',
        params: { initialGender: selectedRole === 'man' ? 'male' : 'female' }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={isDark ? ['rgba(255, 77, 103, 0.1)', '#0f0f13'] : ['rgba(255, 77, 103, 0.05)', '#f8f9fa']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4D67" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Who are you?</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Select your gender</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Male Card */}
        <TouchableOpacity style={[styles.card, { borderColor: colors.border }]} onPress={() => onRoleSelect('man')} activeOpacity={0.8}>
          <LinearGradient colors={isDark ? ['#2A2D3C', '#1E1E24'] : ['#ffffff', '#f8f9fa']} style={styles.cardGradient} start={{x:0,y:0}} end={{x:0,y:1}}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="male" size={50} color="#3B82F6" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Male</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Female Card */}
        <TouchableOpacity style={[styles.card, { borderColor: colors.border }]} onPress={() => onRoleSelect('woman')} activeOpacity={0.8}>
          <LinearGradient colors={isDark ? ['#2A2D3C', '#1E1E24'] : ['#ffffff', '#f8f9fa']} style={styles.cardGradient} start={{x:0,y:0}} end={{x:0,y:1}}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 77, 103, 0.1)' }]}>
              <Ionicons name="female" size={50} color="#FF4D67" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Female</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardGradient: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    marginBottom: 20,
    gap: 6,
  },
  logoutText: {
    color: '#FF4D67',
    fontWeight: '700',
    fontSize: 14,
  },
});
