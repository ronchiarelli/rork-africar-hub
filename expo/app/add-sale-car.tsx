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
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LOCATIONS } from '@/constants/locations';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useCreateSaleCar } from '@/lib/queries/dealer';
import { getErrorMessage } from '@/lib/errors';
import type { SaleCar } from '@/types/car';

const CATEGORIES = ['SUV', 'Sedan', 'Hatchback', 'Van'];
const TRANSMISSIONS: SaleCar['transmission'][] = ['Automatic', 'Manual'];
const FUEL_TYPES: SaleCar['fuelType'][] = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const CONDITIONS: SaleCar['condition'][] = ['New', 'Foreign Used', 'Locally Used'];

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

export default function AddSaleCarScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const createSaleCar = useCreateSaleCar();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [salePrice, setSalePrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [transmission, setTransmission] = useState<SaleCar['transmission']>('Automatic');
  const [fuelType, setFuelType] = useState<SaleCar['fuelType']>('Petrol');
  const [condition, setCondition] = useState<SaleCar['condition']>('Foreign Used');
  const [description, setDescription] = useState('');

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to add a car photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!brand || !model || !salePrice || !imageUri) {
      Alert.alert('Missing Info', 'Please fill in brand, model, sale price, and add a photo.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${currentUser.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('car-images').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(path);

      createSaleCar.mutate(
        {
          brand,
          model,
          year: Number(year) || new Date().getFullYear(),
          category,
          image: publicUrlData.publicUrl,
          salePrice: Number(salePrice) || 0,
          mileage: Number(mileage) || 0,
          location,
          fuelType,
          transmission,
          condition,
          description,
          features: [],
          dealerName: currentUser.name,
          dealerPhone: currentUser.phone,
        },
        {
          onSuccess: () => {
            Alert.alert('Car Listed', 'Your car is now live on the marketplace.', [
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
    }
  }, [currentUser, brand, model, year, category, imageUri, salePrice, mileage, location, fuelType, transmission, condition, description, createSaleCar, router]);

  const isBusy = isUploading || createSaleCar.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.imagePicker} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Camera size={28} color={Colors.gray[400]} />
            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </Pressable>

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
      <Field label="Transmission">
        <ChipRow options={TRANSMISSIONS} value={transmission} onChange={setTransmission} />
      </Field>
      <Field label="Fuel Type">
        <ChipRow options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
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

      <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={() => void handleSubmit()} disabled={isBusy}>
        {isBusy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>List This Car</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 60 },
  imagePicker: { marginBottom: 20 },
  previewImage: { width: '100%', height: 200, borderRadius: 16 },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  imagePlaceholderText: { color: Colors.gray[400], fontSize: 14, fontWeight: '600' as const },
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
