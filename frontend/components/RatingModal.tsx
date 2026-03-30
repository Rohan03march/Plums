import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCall } from '../context/CallContext';
import { getAvatarSource } from '../services/firebaseService';

const { width } = Dimensions.get('window');

export default function RatingModal() {
  const { colors } = useTheme();
  const { 
    showRatingModal, 
    userRating, 
    setUserRating, 
    submitRating, 
    skipRating,
    lastCallData,
    isSubmittingRating
  } = useCall();

  if (!showRatingModal || !lastCallData) return null;

  return (
    <Modal transparent visible={showRatingModal} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
          <Image 
            source={getAvatarSource(
              lastCallData.receiverAvatar || undefined, 
              'woman' // Rating is always for the woman/creator
            )} 
            style={styles.placeholderAvatarLarge} 
          />
          <Text style={[styles.ratingTitle, { color: colors.text }]}>Rate Your Call</Text>
          <Text style={[styles.ratingSub, { color: colors.subText }]}>
            How was your conversation with {lastCallData.receiverName || 'the creator'}?
          </Text>
          
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                <Ionicons 
                  name={userRating >= star ? "star" : "star-outline"} 
                  size={40} 
                  color={userRating >= star ? "#FFD700" : colors.subText} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.submitRatingBtn, { opacity: (userRating === 0 || isSubmittingRating) ? 0.5 : 1 }]} 
            onPress={submitRating} 
            disabled={userRating === 0 || isSubmittingRating}
          >
            {isSubmittingRating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={skipRating} disabled={isSubmittingRating}>
            <Text style={[styles.skipText, { color: colors.subText, opacity: isSubmittingRating ? 0.5 : 1 }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  ratingCard: { 
    width: width * 0.85, 
    padding: 30, 
    borderRadius: 32, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  placeholderAvatarLarge: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FF4D67'
  },
  ratingTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginBottom: 10 
  },
  ratingSub: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 25 
  },
  starsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 30 
  },
  submitRatingBtn: { 
    backgroundColor: '#FF4D67', 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    borderRadius: 24, 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  submitRatingText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  skipBtn: { 
    padding: 10 
  },
  skipText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
});
