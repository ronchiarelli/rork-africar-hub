import React, { useCallback, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, Camera, Send, CheckCircle2, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useBookingDetail } from '@/lib/queries/bookings';
import { useSubmitIssueReport } from '@/lib/queries/issueReports';
import { getErrorMessage } from '@/lib/errors';

const CATEGORIES = ['Mechanical', 'Cleanliness', 'Damage', 'Safety', 'Other'];

export default function ReportIssueScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { data: booking, isLoading } = useBookingDetail(bookingId);
  const submitReport = useSubmitIssueReport();

  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0] || !currentUser?.id) return;

    setIsUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${currentUser.id}/issue-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('car-images').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(path);
      setPhotoUri(publicUrlData.publicUrl);
    } catch (err) {
      Alert.alert('Upload Failed', getErrorMessage(err, 'Could not upload your photo. Please try again.'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [currentUser?.id]);

  const handleSubmit = useCallback(() => {
    if (!category) {
      Alert.alert('Category Required', 'Please select what kind of issue this is.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please describe the issue.');
      return;
    }
    if (!booking) return;
    submitReport.mutate(
      { bookingId: booking.id, carId: booking.carId, category, description: description.trim(), photoUrl: photoUri },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => Alert.alert('Could Not Submit', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [category, description, photoUri, booking, submitReport]);

  const handleDone = useCallback(() => {
    router.back();
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
        <Text style={styles.successTitle}>Issue Reported</Text>
        <Text style={styles.successSub}>The car owner and our support team have been notified and will follow up with you.</Text>
        <Pressable style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Done</Text>
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

        <View style={styles.warningBanner}>
          <AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.warningText}>Let us know what went wrong — we&apos;ll pass this along to the owner and our team.</Text>
        </View>

        <Text style={styles.label}>What type of issue is this?</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
              testID={`issue-category-${c}`}
            >
              <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.label}>Describe the issue</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="What happened? Be as specific as you can..."
            placeholderTextColor={Colors.gray[400]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            testID="issue-description-input"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <Text style={styles.label}>Add a photo (optional)</Text>
        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
            <Pressable style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)} testID="remove-issue-photo">
              <X size={16} color={Colors.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addPhotoBtn} onPress={handlePickPhoto} disabled={isUploadingPhoto} testID="add-issue-photo">
            {isUploadingPhoto ? (
              <ActivityIndicator color={Colors.gray[500]} />
            ) : (
              <>
                <Camera size={20} color={Colors.gray[500]} />
                <Text style={styles.addPhotoText}>Attach Photo</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={[styles.submitBtn, (!category || !description.trim() || submitReport.isPending || isUploadingPhoto) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!category || !description.trim() || submitReport.isPending || isUploadingPhoto}
          testID="submit-issue-btn"
        >
          {submitReport.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Send size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>Submit Report</Text>
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
    marginBottom: 16,
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
  warningBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryChipActive: {
    backgroundColor: Colors.orange.primary,
    borderColor: Colors.orange.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[700],
  },
  categoryTextActive: {
    color: Colors.white,
  },
  descriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  descriptionInput: {
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
  addPhotoBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed' as const,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[500],
  },
  photoPreviewWrap: {
    position: 'relative' as const,
    width: 120,
    height: 120,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 14,
  },
  removePhotoBtn: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
