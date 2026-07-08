import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Send, CheckCircle2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useBookingDetail } from '@/lib/queries/bookings';
import { useSubmitReview } from '@/lib/queries/reviews';
import { getErrorMessage } from '@/lib/errors';

const QUICK_TAGS = ['Clean car', 'Great owner', 'Smooth ride', 'On time', 'Accurate listing'];

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: booking, isLoading } = useBookingDetail(bookingId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!booking) return;
    submitReview.mutate(
      { bookingId: booking.id, carId: booking.carId, rating, comment: review, tags: selectedTags },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => Alert.alert('Could Not Submit', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [rating, review, selectedTags, booking, submitReview]);

  const handleDone = useCallback(() => {
    router.dismissAll();
    router.replace('/(tabs)/bookings');
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <Pressable style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <CheckCircle2 size={48} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Review Submitted!</Text>
        <Text style={styles.successSub}>Thank you for your feedback. It helps other renters make informed decisions.</Text>
        <Pressable style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Back to Bookings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.carCard}>
          <Image source={{ uri: booking.car.image }} style={styles.carImage} contentFit="cover" />
          <View style={styles.carInfo}>
            <Text style={styles.carBrand}>{booking.car.brand}</Text>
            <Text style={styles.carModel}>{booking.car.model}</Text>
            <Text style={styles.carTrip}>{booking.pickupDate} → {booking.returnDate}</Text>
          </View>
        </View>

        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>How was your trip?</Text>
          <Text style={styles.ratingSub}>Rate your experience with this car</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
              >
                <Star
                  size={40}
                  color={star <= rating ? Colors.star : Colors.gray[300]}
                  fill={star <= rating ? Colors.star : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 1 && 'Terrible'}
            {rating === 2 && 'Poor'}
            {rating === 3 && 'Average'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
            {rating === 0 && 'Tap a star to rate'}
          </Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Share more about your experience</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about the car condition, cleanliness, owner communication, and overall experience..."
            placeholderTextColor={Colors.gray[400]}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length}/500</Text>
        </View>

        <View style={styles.quickTags}>
          <Text style={styles.tagsLabel}>Quick tags</Text>
          <View style={styles.tagsRow}>
            {QUICK_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={[styles.submitBtn, (rating === 0 || submitReview.isPending) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitReview.isPending}
        >
          {submitReview.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Send size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  carCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  carImage: {
    width: 110,
    height: 110,
  },
  carInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center' as const,
  },
  carBrand: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  carModel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  carTrip: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 6,
  },
  ratingCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  ratingSub: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: Colors.gray[900],
    lineHeight: 20,
    height: 140,
  },
  charCount: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'right' as const,
    marginTop: 8,
  },
  quickTags: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.purple.faint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.purple.light + '30',
  },
  tagChipActive: {
    backgroundColor: Colors.purple.medium,
    borderColor: Colors.purple.medium,
  },
  tagTextActive: {
    color: Colors.white,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.purple.medium,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  submitBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.gray[300],
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 30,
    backgroundColor: Colors.white,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.success + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  successSub: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
    width: '100%',
    alignItems: 'center' as const,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
