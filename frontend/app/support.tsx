import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';

export default function HelpSupport() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@plums.app').catch(() => {
      Alert.alert("Error", "No email app found on your device.");
    });
  };

  const FAQItem = ({ question, answer, index }: { question: string; answer: string; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(400 + index * 100).duration(600)}
      style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.question, { color: colors.text }]}>{question}</Text>
      <Text style={[styles.answer, { color: colors.subText }]}>{answer}</Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <Animated.View 
        entering={FadeInUp.duration(600)}
        style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Cards */}
        <View style={styles.supportMethodSection}>
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ flex: 1 }}>
            <TouchableOpacity 
              style={[styles.supportCard, { backgroundColor: colors.card }]}
              onPress={handleEmailSupport}
            >
              <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="mail" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.supportTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.supportSub, { color: colors.subText }]}>support@plums.com</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ flex: 1 }}>
            <TouchableOpacity style={[styles.supportCard, { backgroundColor: colors.card }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#10B981" />
              </View>
              <Text style={[styles.supportTitle, { color: colors.text }]}>Live Chat</Text>
              <Text style={[styles.supportSub, { color: colors.subText }]}>Coming Soon</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.Text 
          entering={FadeIn}
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Frequently Asked Questions
        </Animated.Text>

        <FAQItem 
          index={0}
          question="How do I top up my Gold coins?"
          answer="Go to the Wallet section in your profile. Select the Gold package you want to purchase and complete the payment using our secure gateway."
        />

        <FAQItem 
          index={1}
          question="Why can't I connect to a call?"
          answer="Ensure you have a stable internet connection and sufficient Gold balance. If the problem persists, try restarting the App."
        />

        <FAQItem 
          index={2}
          question="Is my privacy protected?"
          answer="Absolutely. We use end-to-end encryption for all calls and we never record your private conversations."
        />

        <FAQItem 
          index={3}
          question="How do I report a user?"
          answer="During a call or from a profile, tap the report icon to flag inappropriate behavior. Our team reviews all reports within 24 hours."
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  supportMethodSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  supportCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  supportSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  faqCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
