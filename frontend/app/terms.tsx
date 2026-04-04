import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function TermsOfService() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const Section = ({ title, content, index }: { title: string; content: string; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(600)}
      style={styles.section}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: colors.subText }]}>{content}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.Text
          entering={FadeInDown.delay(100)}
          style={[styles.lastUpdated, { color: colors.subText }]}
        >
          Last Updated: April 2026
        </Animated.Text>

        <Section
          index={0}
          title="1. Acceptance of Terms"
          content="By accessing or using Plums, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application."
        />

        <Section
          index={1}
          title="2. User Accounts"
          content="You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to use this app."
        />

        <Section
          index={2}
          title="3. Creator Responsibilities"
          content="Creators are expected to maintain professional standards during calls. Harassment, explicit content without consent, or sharing of personal contact information is strictly prohibited and can lead to account termination."
        />

        <Section
          index={3}
          title="4. Payments & Earnings"
          content="Earnings are calculated based on call duration and gifts received. Plums reserves the right to withhold payments in cases of suspected fraud or violation of community guidelines."
        />

        <Section
          index={4}
          title="5. User Content"
          content="You retain ownership of the content you share, but you grant Plums a license to use, display, and distribute such content for the operation and improvement of the service."
        />

        <Section
          index={5}
          title="6. Termination"
          content="We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users."
        />

        <Section
          index={6}
          title="7. Governing Law"
          content="These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Plums operates."
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
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
});
