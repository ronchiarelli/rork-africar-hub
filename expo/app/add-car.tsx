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
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { LOCATIONS } from '@/constants/locations';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useCreateCar } from '@/lib/queries/fleet';
import { getErrorMessage } from '@/lib/errors';
import MultiImagePicker from '@/components/MultiImagePicker';
import { ProgressBar } from '@/components/IndeterminateProgressBar';
import type { Car } from '@/types/car';

const CATEGORIES = ['SUV', 'Sedan', 'Hatchback', 'Van'];
const TRANSMISSIONS: Car['transmission'][] = ['Automatic', 'Manual'];
const FUEL_TYPES: Car['fuelType'][] = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable key={opt} style={[styles.chip, value === opt && styles.chipActive]} onPress={() => onChange(opt)}>
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AddCarScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const createCar = useCreateCar();

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerWeek, setPricePerWeek] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [seats, setSeats] = useState('5');
  const [transmission, setTransmission] = useState<Car['transmission']>('Automatic');
  const [fuelType, setFuelType] = useState<Car['fuelType']>('Petrol');
  const [horsepower, setHorsepower] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    const isAdmin = currentUser.role === 'admin';
    if (!isAdmin && currentUser.verificationStatus !== 'pending' && currentUser.verificationStatus !== 'approved') {
      Alert.alert('Verification Required', 'Please complete KYC verification before listing a car.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify Now', onPress: () => router.push('/kyc-verification') },
      ]);
      return;
    }
    if (!brand || !model || !pricePerDay || images.length === 0) {
      Alert.alert('Missing Info', 'Please fill in brand, model, daily price, and add at least one photo.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ done: 0, total: images.length });
    try {
      const uploadedUrls: string[] = [];
      for (const uri of images) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
        const path = `${currentUser.id}/${Date.now()}-${uploadedUrls.length}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('car-images').upload(path, blob, {
          contentType: blob.type || 'image/jpeg',
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(path);
        uploadedUrls.push(publicUrlData.publicUrl);
        setUploadProgress({ done: uploadedUrls.length, total: images.length });
      }

      createCar.mutate(
        {
          brand,
          model,
          year: Number(year) || new Date().getFullYear(),
          category,
          images: uploadedUrls,
          pricePerDay: Number(pricePerDay) || 0,
          pricePerWeek: Number(pricePerWeek) || (Number(pricePerDay) || 0) * 6,
          location,
          seats: Number(seats) || 5,
          transmission,
          fuelType,
          horsepower: Number(horsepower) || 0,
          hasAC: true,
          description,
          features: [],
          ownerName: currentUser.name,
          ownerPhone: currentUser.phone,
        },
        {
          onSuccess: () => {
            Alert.alert('Car Listed', 'Your car is now live and bookable.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
          onError: (err) => {
            Alert.alert('Could Not List Car', getErrorMessage(err, 'Please try again.'));
          },
        }
      );
    } catch (err) {
      Alert.alert('Upload Failed', getErrorMessage(err, 'Could not upload the photo. Please try again.'));
    } finally {
      setIsUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  }, [currentUser, brand, model, year, category, images, pricePerDay, pricePerWeek, location, seats, transmission, fuelType, horsepower, description, createCar, router]);

  const isBusy = isUploading || createCar.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="Photos">
        <MultiImagePicker images={images} onChange={setImages} />
      </Field>

      <Field label="Brand">
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g. Toyota" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Model">
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="e.g. Land Cruiser V8" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Year">
        <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Category">
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
      </Field>
      <Field label="Price Per Day (GH₵)">
        <TextInput style={styles.input} value={pricePerDay} onChangeText={setPricePerDay} keyboardType="numeric" placeholder="e.g. 450" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Price Per Week (GH₵) — optional">
        <TextInput style={styles.input} value={pricePerWeek} onChangeText={setPricePerWeek} keyboardType="numeric" placeholder="Defaults to 6x daily rate" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Location">
        <ChipRow options={LOCATIONS} value={location} onChange={setLocation} />
      </Field>
      <Field label="Seats">
        <TextInput style={styles.input} value={seats} onChangeText={setSeats} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Transmission">
        <ChipRow options={TRANSMISSIONS} value={transmission} onChange={setTransmission} />
      </Field>
      <Field label="Fuel Type">
        <ChipRow options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
      </Field>
      <Field label="Horsepower">
        <TextInput style={styles.input} value={horsepower} onChangeText={setHorsepower} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Description">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Tell customers about this car..."
          placeholderTextColor={Colors.gray[400]}
        />
      </Field>

      {isBusy && (
        <View style={styles.progressWrap}>
          <ProgressBar progress={uploadProgress.total > 0 ? uploadProgress.done / uploadProgress.total : 1} />
          <Text style={styles.progressText}>
            {isUploading && uploadProgress.total > 0
              ? `Uploading photo ${Math.min(uploadProgress.done + 1, uploadProgress.total)} of ${uploadProgress.total}…`
              : 'Saving listing…'}
          </Text>
        </View>
      )}

      <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={() => void handleSubmit()} disabled={isBusy}>
        {isBusy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>List This Car</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 60 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.gray[700], marginBottom: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.gray[900],
  },
  textArea: { height: 90, textAlignVertical: 'top' as const },
  chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray[100] },
  chipActive: { backgroundColor: Colors.orange.primary },
  chipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.gray[700] },
  chipTextActive: { color: Colors.white },
  progressWrap: { marginTop: 16, gap: 8 },
  progressText: { fontSize: 13, color: Colors.gray[600], textAlign: 'center' as const, fontWeight: '600' as const },
  submitBtn: {
    backgroundColor: Colors.orange.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
});
