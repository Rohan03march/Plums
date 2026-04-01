import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withRepeat, 
  withSequence,
  FadeInUp,
  FadeInDown,
  Layout
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const GUIDE_STEPS = [
  {
    title: 'Discover Friends',
    desc: 'Browse through profiles of amazing people. Find someone you click with and start a conversation.',
    icon: 'people-outline',
    color: '#8B5CF6'
  },
  {
    title: 'Top Up Gold',
    desc: 'Purchase Gold coins from the wallet. Gold is used to initiate high-quality video and audio calls.',
    icon: 'wallet-outline',
    color: '#F59E0B'
  },
  {
    title: 'Crystal Clear Calls',
    desc: 'Connect instantly with low-latency video and audio experience. Pay only for the minutes you use.',
    icon: 'videocam-outline',
    color: '#10B981'
  },
  {
    title: 'Safety & Privacy',
    desc: 'We prioritize your protection. Never share sensitive personal or financial information during calls.',
    icon: 'shield-checkmark-outline',
    color: '#FF4D67'
  }
];

const StepCard = ({ step, index, colors }: { step: typeof GUIDE_STEPS[0], index: number, colors: any }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 150).springify()}
      style={[styles.stepCard, { backgroundColor: colors.card }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${step.color}20` }]}>
        <Ionicons name={step.icon as any} size={26} color={step.color} />
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.stepDesc, { color: colors.subText }]}>{step.desc}</Text>
      </View>
    </Animated.View>
  );
};

export default function AppGuide() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const heroScale = useSharedValue(1);

  useEffect(() => {
    heroScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }]
  }));

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>App Guide</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View 
          entering={FadeInUp.delay(200).duration(800)}
          style={[styles.introSection, animatedHeroStyle]}
        >
          <LinearGradient
            colors={['#FF4D67', '#FF8A9B']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="auto-fix" size={40} color="#fff" />
            <Text style={styles.heroTitle}>Welcome to Plums</Text>
            <Text style={styles.heroSub}>Your gateway to meaningful connections and sweet friendships.</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text 
          entering={FadeInDown.delay(300)}
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          How it works
        </Animated.Text>

        {GUIDE_STEPS.map((step, index) => (
          <StepCard key={index} step={step} index={index} colors={colors} />
        ))}

        <Animated.View 
          entering={FadeInUp.delay(1000)}
          style={[styles.footerInfo, { backgroundColor: colors.info + '10' }]}
        >
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.footerText, { color: colors.subText }]}>
            Need more help? Our support team is available 24/7 to assist you with any questions.
          </Text>
        </Animated.View>
        
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
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    marginBottom: 30,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerInfo: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
    gap: 12,
    alignItems: 'center',
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  }
});
