import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function PrivacyPolicy() {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
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
          title="1. Introduction" 
          content="Welcome to Plums. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us."
        />

        <Section 
          index={1}
          title="2. Information We Collect" 
          content="We collect personal information that you voluntarily provide to us when registering at the App, such as name, email, and profile details. In the case of creators, we additionally collect payment information to facilitate earnings."
        />

        <Section 
          index={2}
          title="3. Call Data & Audio/Video" 
          content="Your privacy during calls is our top priority. While we use third-party services for high-quality connections, we do not record or monitor your audio or video streams. All data is handled according to strict encryption standards."
        />

        <Section 
          index={3}
          title="4. How We Use Your Information" 
          content="We use the information we collect to operate, maintain, and provide the features of the App, including personalizing content, facilitating payments, and ensuring user safety."
        />

        <Section 
          index={4}
          title="5. Data Sharing" 
          content="We do not sell your personal data. We only share information with third-party service providers (like payment processors) necessary for the App's operation or as required by law."
        />

        <Section 
          index={5}
          title="6. Your Rights" 
          content="You have the right to access, correct, or delete your personal data at any time through the App's profile settings or by contacting our support team."
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
