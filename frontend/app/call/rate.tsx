import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, Layout, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useCall } from '../../context/CallContext';
import { getAvatarSource } from '../../services/firebaseService';

const { width, height } = Dimensions.get('window');

const STAR_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing',
};

const REASONS: Record<number, string[]> = {
  1: ['Poor Connection', 'Rude Behavior', 'Fake Profile', 'No Audio/Video'],
  2: ['Distracted', 'Too Expensive', 'Low Quality', 'Ended Early'],
  3: ['Average', 'Fine', 'Polite', 'Just Okay'],
  4: ['Friendly', 'Great Voice', 'Interesting', 'Fun Call'],
  5: ['Super Friendly', 'Amazing Vibes!', 'Highly Recommended', 'Will Call Again!'],
};

export default function RatingScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { submitRating, isSubmittingRating } = useCall();

  const [rating, setRating] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // Parse params
  const targetId = searchParams.receiverId as string;
  const targetName = searchParams.receiverName as string || 'User';
  const targetAvatar = searchParams.receiverAvatar as string || undefined;

  useEffect(() => {
    // Reset reason when rating changes
    setSelectedReason(null);
  }, [rating]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    const success = await submitRating(rating, selectedReason || undefined);
    if (success) {
      router.replace(searchParams.role === 'caller' ? '/(men)' : '/(women)');
    }
  };

  const handleSkip = () => {
    router.replace(searchParams.role === 'caller' ? '/(men)' : '/(women)');
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            style={styles.starWrapper}
          >
            <Ionicons
              name={rating >= star ? 'star' : 'star-outline'}
              size={48}
              color={rating >= star ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReasons = () => {
    if (rating === 0) return null;

    return (
      <Animated.View 
        entering={FadeInDown.duration(400)} 
        style={styles.reasonsWrapper}
        layout={Layout.springify()}
      >
        <Text style={[styles.reasonTitle, { color: 'rgba(255, 255, 255, 0.7)' }]}>
          What went {rating >= 4 ? 'well' : 'wrong'}?
        </Text>
        <View style={styles.reasonsGrid}>
          {REASONS[rating].map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[
                  styles.reasonChip,
                  isSelected && styles.reasonChipSelected,
                  { borderColor: isSelected ? '#FF4D67' : 'rgba(255, 255, 255, 0.1)' }
                ]}
              >
                <Text style={[
                  styles.reasonText,
                  { color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#0F041A', '#000000'] : ['#2D0B1E', '#0F041A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Rating</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* User Info */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={getAvatarSource(targetAvatar, 'woman')}
              style={styles.avatar}
              contentFit="cover"
            />
            {rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{rating}</Text>
                <Ionicons name="star" size={12} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{targetName}</Text>
          <Text style={styles.subtext}>How was your conversation?</Text>
        </Animated.View>

        {/* Star Selection */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.ratingSection}>
          {renderStars()}
          <Text style={styles.starLabel}>
            {rating > 0 ? STAR_LABELS[rating] : 'Select stars'}
          </Text>
        </Animated.View>

        {/* Reason Selection */}
        {renderReasons()}

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (rating === 0 || isSubmittingRating) && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmittingRating}
          >
            {isSubmittingRating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
            <Text style={styles.skipLinkText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    minHeight: height,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(255, 77, 103, 0.3)',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF4D67',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: '500',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  starWrapper: {
    padding: 5,
  },
  starLabel: {
    color: '#FF4D67',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reasonsWrapper: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reasonChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitBtn: {
    width: '100%',
    height: 65,
    borderRadius: 32,
    backgroundColor: '#FF4D67',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipLink: {
    marginTop: 25,
    padding: 10,
  },
  skipLinkText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    fontWeight: '600',
  },
});
