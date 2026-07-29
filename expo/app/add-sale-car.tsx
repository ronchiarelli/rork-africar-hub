import React, { useState, useCallback, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { LOCATIONS } from '@/constants/locations';
import { VEHICLE_CATEGORIES } from '@/constants/vehicleCategories';
import { useAuth } from '@/providers/AuthProvider';
import { uploadImageAsync, extensionFromUri } from '@/lib/imageUpload';
import { useCreateSaleCar, useUpdateSaleCar } from '@/lib/queries/dealer';
import { useSaleCarDetails } from '@/lib/queries/cars';
import { getErrorMessage } from '@/lib/errors';
import { isKycCleared, listingResultMessage } from '@/lib/kyc';
import MultiImagePicker from '@/components/MultiImagePicker';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { ProgressBar } from '@/components/IndeterminateProgressBar';
import { getNavBarClearance } from '@/components/BottomNavBar';
import type { SaleCar } from '@/types/car';

const CATEGORIES = VEHICLE_CATEGORIES;
const TRANSMISSIONS: SaleCar['transmission'][] = ['Automatic', 'Manual'];
const FUEL_TYPES: SaleCar['fuelType'][] = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const CONDITIONS: SaleCar['condition'][] = ['New', 'Foreign Used', 'Locally Used'];
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

function MultiChipRow({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable key={opt} style={[styles.chip, selected.includes(opt) && styles.chipActive]} onPress={() => onToggle(opt)}>
          <Text style={[styles.chipText, selected.includes(opt) && styles.chipTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AddSaleCarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { data: existingSaleCar, isLoading: isLoadingSaleCar } = useSaleCarDetails(id);
  const createSaleCar = useCreateSaleCar();
  const updateSaleCar = useUpdateSaleCar();

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [salePrice, setSalePrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [transmission, setTransmission] = useState<SaleCar['transmission']>('Automatic');
  const [fuelType, setFuelType] = useState<SaleCar['fuelType']>('Petrol');
  const [condition, setCondition] = useState<SaleCar['condition']>('Foreign Used');
  const [features, setFeatures] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!existingSaleCar) return;
    setImages(existingSaleCar.images);
    setBrand(existingSaleCar.brand);
    setModel(existingSaleCar.model);
    setYear(String(existingSaleCar.year));
    setCategory(existingSaleCar.category);
    setSalePrice(String(existingSaleCar.salePrice));
    setMileage(String(existingSaleCar.mileage));
    setLocation(existingSaleCar.location);
    setAddress(existingSaleCar.address ?? '');
    setLatitude(existingSaleCar.latitude);
    setLongitude(existingSaleCar.longitude);
    setTransmission(existingSaleCar.transmission);
    setFuelType(existingSaleCar.fuelType);
    setCondition(existingSaleCar.condition);
    setFeatures(existingSaleCar.features);
    setDescription(existingSaleCar.description);
  }, [existingSaleCar]);

  const toggleFeature = useCallback((feature: string) => {
    setFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!brand || !model || !salePrice || images.length === 0) {
      Alert.alert('Missing Info', 'Please fill in brand, model, sale price, and add at least one photo.');
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
        salePrice: Number(salePrice) || 0,
        mileage: Number(mileage) || 0,
        location,
        address: address.trim() || null,
        latitude,
        longitude,
        fuelType,
        transmission,
        condition,
        description,
        features,
        dealerName: currentUser.name,
        dealerPhone: currentUser.phone,
        dealerAvatar: currentUser.avatar,
      };

      const mutation = isEditing
        ? new Promise<void>((resolve, reject) => {
            updateSaleCar.mutate({ saleCarId: id as string, input }, { onSuccess: () => resolve(), onError: reject });
          })
        : new Promise<void>((resolve, reject) => {
            createSaleCar.mutate(input, { onSuccess: () => resolve(), onError: reject });
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
  }, [currentUser, brand, model, year, category, images, salePrice, mileage, location, address, latitude, longitude, fuelType, transmission, condition, features, description, isEditing, id, createSaleCar, updateSaleCar, router]);

  const isBusy = isUploading || createSaleCar.isPending || updateSaleCar.isPending;

  if (isEditing && isLoadingSaleCar) {
    return (
      <View style={styles.loadingWrap}>
        <Stack.Screen options={{ title: 'Edit Listing' }} />
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
      <Stack.Screen options={{ title: isEditing ? 'Edit Listing' : 'List a Car for Sale' }} />
      <Field label="Photos">
        <MultiImagePicker images={images} onChange={setImages} />
      </Field>

      <Field label="Brand">
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g. Toyota" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Model">
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="e.g. Highlander XLE" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Year">
        <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Category">
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
      </Field>
      <Field label="Sale Price (GH₵)">
        <TextInput style={styles.input} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" placeholder="e.g. 195000" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Mileage (km)">
        <TextInput style={styles.input} value={mileage} onChangeText={setMileage} keyboardType="numeric" placeholder="e.g. 34000" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Condition">
        <ChipRow options={CONDITIONS} value={condition} onChange={setCondition} />
      </Field>
      <Field label="Location">
        <ChipRow options={LOCATIONS} value={location} onChange={setLocation} />
      </Field>
      <Field label="Exact Viewing Address (optional)">
        <LocationAutocomplete
          value={address}
          onChangeValue={setAddress}
          onSelect={(result) => {
            setAddress(result.address);
            setLatitude(result.latitude);
            setLongitude(result.longitude);
          }}
          placeholder="Search for the viewing address..."
          testID="add-sale-car-address"
        />
      </Field>
      <Field label="Transmission">
        <ChipRow options={TRANSMISSIONS} value={transmission} onChange={setTransmission} />
      </Field>
      <Field label="Fuel Type">
        <ChipRow options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
      </Field>
      <Field label="Features">
        <MultiChipRow options={FEATURE_OPTIONS} selected={features} onToggle={toggleFeature} />
      </Field>
      <Field label="Description">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Tell buyers about this car..."
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
