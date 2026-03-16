import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const HOBBIES = ['Music 🎵', 'Travel ✈️', 'Cooking 🍳', 'Gaming 🎮', 'Movies 🍿', 'Reading 📚', 'Fitness 🏋️‍♀️', 'Art 🎨'];

export default function SetupWomen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby));
    } else {
      if (selectedHobbies.length < 5) {
        setSelectedHobbies([...selectedHobbies, hobby]);
      }
    }
  };

  const handleComplete = () => {
    router.replace('/(women)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={isDark ? ['rgba(255, 77, 103, 0.1)', '#0f0f13'] : ['rgba(255, 77, 103, 0.05)', '#f8f9fa']} style={StyleSheet.absoluteFillObject} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>Help callers know a bit more about you</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Aisha"
              placeholderTextColor={colors.subText}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>About Me</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Tell listeners what you like to talk about..."
              placeholderTextColor={colors.subText}
              multiline
              numberOfLines={4}
              value={about}
              onChangeText={setAbout}
              maxLength={150}
            />
            <Text style={[styles.charCount, { color: colors.subText }]}>{about.length}/150</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Select Hobbies (Max 5)</Text>
            <View style={styles.hobbiesContainer}>
              {HOBBIES.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby);
                return (
                  <TouchableOpacity
                    key={hobby}
                    style={[styles.hobbyBadge, { borderColor: colors.border }, isSelected && styles.hobbyBadgeSelected]}
                    onPress={() => toggleHobby(hobby)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.hobbyText, { color: colors.subText }, isSelected && { color: '#fff' }]}>
                      {hobby}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, (!name || selectedHobbies.length === 0) && styles.buttonDisabled]} 
            onPress={handleComplete}
            disabled={!name || selectedHobbies.length === 0}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#FF4D67', '#FF8A9B']} style={styles.buttonGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={[styles.buttonText, { color: colors.card }]}>Start Earning</Text>
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
    backgroundColor: '#0f0f13',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hobbyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#333',
  },
  hobbyBadgeSelected: {
    backgroundColor: 'rgba(255, 77, 103, 0.2)',
    borderColor: '#FF4D67',
  },
  hobbyText: {
    color: '#a0a0a0',
    fontWeight: '600',
  },
  hobbyTextSelected: {
    color: '#fff',
  },
  button: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
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
});
