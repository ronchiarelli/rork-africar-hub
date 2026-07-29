import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { LOCATIONS } from '@/constants/locations';
import { VEHICLE_CATEGORIES } from '@/constants/vehicleCategories';
import { VEHICLE_BRANDS, MODELS_BY_BRAND } from '@/constants/vehicleBrands';
import { useAuth } from '@/providers/AuthProvider';
import { uploadImageAsync, extensionFromUri } from '@/lib/imageUpload';
import { useCreateCar, useUpdateCar } from '@/lib/queries/fleet';
import { useCarDetails } from '@/lib/queries/cars';
import { getErrorMessage } from '@/lib/errors';
import { isKycCleared, listingResultMessage } from '@/lib/kyc';
import MultiImagePicker from '@/components/MultiImagePicker';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import SuggestInput from '@/components/SuggestInput';
import FeaturePicker from '@/components/FeaturePicker';
import { ProgressBar } from '@/components/IndeterminateProgressBar';
import { getNavBarClearance } from '@/components/BottomNavBar';
import type { Car } from '@/types/car';

const CATEGORIES = VEHICLE_CATEGORIES;
const TRANSMISSIONS: Car['transmission'][] = ['Automatic', 'Manual'];
const FUEL_TYPES: Car['fuelType'][] = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const FEATURE_OPTIONS = [
  'GPS Navigation', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Backup Camera',
  '4WD', 'Heated Seats', 'Premium Sound', 'Wireless Charging', 'Lane Assist',
];

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
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { data: existingCar, isLoading: isLoadingCar } = useCarDetails(id);
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();

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
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [seats, setSeats] = useState('5');
  const [transmission, setTransmission] = useState<Car['transmission']>('Automatic');
  const [fuelType, setFuelType] = useState<Car['fuelType']>('Petrol');
  const [horsepower, setHorsepower] = useState('');
  const [hasAC, setHasAC] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!existingCar) return;
    setImages(existingCar.images);
    setBrand(existingCar.brand);
    setModel(existingCar.model);
    setYear(String(existingCar.year));
    setCategory(existingCar.category);
    setPricePerDay(String(existingCar.pricePerDay));
    setPricePerWeek(String(existingCar.pricePerWeek));
    setLocation(existingCar.location);
    setAddress(existingCar.address ?? '');
    setLatitude(existingCar.latitude);
    setLongitude(existingCar.longitude);
    setSeats(String(existingCar.seats));
    setTransmission(existingCar.transmission);
    setFuelType(existingCar.fuelType);
    setHorsepower(String(existingCar.horsepower));
    setHasAC(existingCar.hasAC);
    setFeatures(existingCar.features);
    setDescription(existingCar.description);
  }, [existingCar]);

  // Match the brand case-insensitively so a typed "toyota" still gets its
  // model list; unknown brands simply get no suggestions.
  const modelSuggestions = useMemo(() => {
    const key = Object.keys(MODELS_BY_BRAND).find((b) => b.toLowerCase() === brand.trim().toLowerCase());
    return key ? MODELS_BY_BRAND[key] : [];
  }, [brand]);

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!brand || !model || !pricePerDay || images.length === 0) {
      Alert.alert('Missing Info', 'Please fill in brand, model, daily price, and add at least one photo.');
      return;
    }

    // Images already hosted (edit mode, pre-filled from the existing
    // listing) are kept as-is — only newly-picked local URIs get uploaded,
    // so re-saving an unchanged photo doesn't create a duplicate copy.
    const imagesToUpload = images.filter((uri) => !uri.startsWith('http://') && !uri.startsWith('https://'));
    setIsUploading(true);
    setUploadProgress({ done: 0, total: imagesToUpload.length });
    try {
      const finalUrls: string[] = [];
      for (const uri of images) {
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          finalUrls.push(uri);
          continue;
        }
        const path = `${currentUser.id}/${Date.now()}-${finalUrls.length}.${extensionFromUri(uri)}`;
        const publicUrl = await uploadImageAsync('car-images', path, uri);
        finalUrls.push(publicUrl);
        setUploadProgress((prev) => ({ done: prev.done + 1, total: prev.total }));
      }

      const input = {
        brand,
        model,
        year: Number(year) || new Date().getFullYear(),
        category,
        images: finalUrls,
        pricePerDay: Number(pricePerDay) || 0,
        pricePerWeek: Number(pricePerWeek) || (Number(pricePerDay) || 0) * 6,
        location,
        address: address.trim() || null,
        latitude,
        longitude,
        seats: Number(seats) || 5,
        transmission,
        fuelType,
        horsepower: Number(horsepower) || 0,
        hasAC,
        description,
        features,
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone,
      };

      const mutation = isEditing
        ? new Promise<void>((resolve, reject) => {
            updateCar.mutate({ carId: id as string, input }, { onSuccess: () => resolve(), onError: reject });
          })
        : new Promise<void>((resolve, reject) => {
            createCar.mutate(input, { onSuccess: () => resolve(), onError: reject });
          });

      await mutation;
      Alert.alert(
        isEditing ? 'Listing Updated' : 'Car Submitted',
        listingResultMessage(isKycCleared(currentUser), isEditing),
        [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(isEditing ? 'Could Not Save Changes' : 'Could Not List Car', getErrorMessage(err, 'Please try again.'));
    } finally {
      setIsUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  }, [currentUser, brand, model, year, category, images, pricePerDay, pricePerWeek, location, address, latitude, longitude, seats, transmission, fuelType, horsepower, hasAC, features, description, isEditing, id, createCar, updateCar, router]);

  const isBusy = isUploading || createCar.isPending || updateCar.isPending;

  if (isEditing && isLoadingCar) {
    return (
      <View style={styles.loadingWrap}>
        <Stack.Screen options={{ title: 'Edit Car' }} />
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
      <Stack.Screen options={{ title: isEditing ? 'Edit Car' : 'List a Car' }} />
      <Field label="Photos">
        <MultiImagePicker images={images} onChange={setImages} />
      </Field>

      <Field label="Brand">
        <SuggestInput
          value={brand}
          onChangeText={setBrand}
          suggestions={VEHICLE_BRANDS}
          placeholder="e.g. Toyota — or type your own"
          testID="listing-brand"
        />
      </Field>
      <Field label="Model">
        <SuggestInput
          value={model}
          onChangeText={setModel}
          suggestions={modelSuggestions}
          placeholder="e.g. Land Cruiser V8 — or type your own"
          testID="listing-model"
        />
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
      <Field label="Exact Pickup Address (optional)">
        <LocationAutocomplete
          value={address}
          onChangeValue={setAddress}
          onSelect={(result) => {
            setAddress(result.address);
            setLatitude(result.latitude);
            setLongitude(result.longitude);
          }}
          placeholder="Search for the pickup address..."
          testID="add-car-address"
        />
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
      <Field label="Air Conditioning">
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{hasAC ? 'Available' : 'Not available'}</Text>
          <Switch value={hasAC} onValueChange={setHasAC} trackColor={{ false: Colors.gray[300], true: Colors.orange.primary + '80' }} thumbColor={hasAC ? Colors.orange.primary : '#f4f3f4'} />
        </View>
      </Field>
      <Field label="Features">
        <FeaturePicker options={FEATURE_OPTIONS} selected={features} onChange={setFeatures} testID="features" />
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
        {isBusy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'List This Car'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingWrap: { flex: 1, backgroundColor: Colors.gray[50], alignItems: 'center' as const, justifyContent: 'center' as const },
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
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchLabel: { fontSize: 14, color: Colors.gray[700], fontWeight: '500' as const },
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
