import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function TermsOfService() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { appUser } = useAuth();
  const isWoman = appUser?.role === 'woman';

  const Section = ({ title, content, index, highlighted = false }: { title: string; content: string; index: number; highlighted?: boolean }) => (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(600)}
      style={[
        styles.section,
        highlighted && {
          backgroundColor: isDark ? 'rgba(255, 77, 103, 0.05)' : '#FFF5F6',
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 77, 103, 0.2)' : '#FFE4E8'
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        {highlighted && <Ionicons name="alert-circle" size={20} color="#FF4D67" style={{ marginRight: 8 }} />}
        <Text style={[styles.sectionTitle, { color: highlighted ? '#FF4D67' : colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.sectionContent, { color: highlighted ? colors.text : colors.subText, fontWeight: highlighted ? '600' : '400' }]}>{content}</Text>
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
          content={isWoman 
            ? "As a Creator, you are responsible for maintaining professional standards. You must provide accurate payout information (UPI/Bank) to receive earnings. Misrepresentation of identity will lead to immediate termination."
            : "You are responsible for maintaining the confidentiality of your account. You agree to use coins respectfully and acknowledge that harassment of creators is strictly prohibited."
          }
        />

        {isWoman ? (
          <>
            <Section
              index={2}
              title="3. Payout & Tax Policy"
              highlighted={true}
              content="All earnings are subject to a 5% TDS (Tax Deducted at Source) as per government regulations. Once a withdrawal is requested, funds will be processed and transferred within 24 hours. You cannot initiate multiple requests concurrently; a new request can only be made after the current one is processed."
            />
            <Section
              index={3}
              title="4. Creator Conduct"
              content="Creators must maintain high-quality interactions. Sharing or requesting external contact information (Phone numbers, Social Media) during calls is a violation of our safety policy and will result in a permanent ban."
            />
          </>
        ) : (
          <>
            <Section
              index={2}
              title="3. Coin Usage & Refunds"
              content="Coins are virtual currency used to initiate calls. Once spent, coins are non-refundable. Any attempt to reverse charges through payment gateways for spent coins will result in immediate account suspension."
            />
            <Section
              index={3}
              title="4. Respectful Interaction"
              content="Plums is a platform for meaningful connection. Any form of abuse, explicit language without mutual consent, or record/capture of calls is strictly prohibited."
            />
          </>
        )}

        <Section
          index={4}
          title="5. Payments & Earnings"
          content={isWoman
            ? "Earnings are calculated in real-time based on successful call completions. Plums reserves the right to audit sessions for quality and compliance before final disbursement."
            : "Payments for coin top-ups are processed securely. Ensure you have a stable connection before initiating a call as deductions start upon connection."
          }
        />

        <Section
          index={5}
          title="6. Data Privacy"
          content="We prioritize your data security. Call metadata and payout details are encrypted. We do not sell your personal information to third parties."
        />

        <Section
          index={6}
          title="7. Termination"
          content="We reserve the right to suspend or terminate accounts that violate community guidelines or legal regulations at our sole discretion."
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
