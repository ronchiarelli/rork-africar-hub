import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, UploadCloud, Link2, Phone, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useBanner, useCreateBanner, useUpdateBanner } from '@/lib/queries/banners';
import { getErrorMessage } from '@/lib/errors';
import type { BannerCtaTypeDb } from '@/types/database';

const CTA_ROUTES = [
  { label: 'Search', route: '/search' },
  { label: 'Marketplace', route: '/marketplace' },
  { label: 'Home', route: '/(tabs)/(home)' },
];

const CTA_TYPES: { type: BannerCtaTypeDb; label: string; icon: typeof Navigation }[] = [
  { type: 'route', label: 'In-App Page', icon: Navigation },
  { type: 'url', label: 'External URL', icon: Link2 },
  { type: 'phone', label: 'Phone Number', icon: Phone },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function AddBannerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { data: existingBanner, isLoading: isLoadingBanner } = useBanner(id);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Book Now');
  const [ctaType, setCtaType] = useState<BannerCtaTypeDb>('route');
  const [ctaDestination, setCtaDestination] = useState(CTA_ROUTES[0].route);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const dropZoneRef = useRef<View>(null);

  useEffect(() => {
    if (!existingBanner) return;
    setImageUri(existingBanner.imageUrl);
    setTag(existingBanner.tag);
    setTitle(existingBanner.title);
    setSubtitle(existingBanner.subtitle);
    setCtaLabel(existingBanner.ctaLabel);
    setCtaType(existingBanner.ctaType);
    setCtaDestination(existingBanner.ctaRoute);
    setIsActive(existingBanner.isActive);
    setDisplayOrder(String(existingBanner.displayOrder));
  }, [existingBanner]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to add a banner image.');
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

  const handleCtaTypeChange = useCallback((type: BannerCtaTypeDb) => {
    setCtaType(type);
    if (type === 'route') setCtaDestination(CTA_ROUTES[0].route);
    else setCtaDestination('');
  }, []);

  // Drag-and-drop image upload on web — react-native-web renders View as a
  // real <div>, so we attach native drag/drop listeners via ref instead of
  // relying on RN touch props, which don't cover HTML5 drag events.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = dropZoneRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(true);
    };
    const handleDragLeave = () => setIsDragActive(false);
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        setImageUri(URL.createObjectURL(file));
      }
    };

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);
    return () => {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!tag || !title || !subtitle || !ctaLabel || !imageUri || !ctaDestination) {
      Alert.alert('Missing Info', 'Please fill in all fields, add an image, and set a call-to-action destination.');
      return;
    }
    if (ctaType === 'url' && !/^https?:\/\/.+/i.test(ctaDestination)) {
      Alert.alert('Invalid URL', 'External URLs must start with http:// or https://');
      return;
    }
    if (ctaType === 'phone' && !/^\+?[0-9\s-]{7,}$/.test(ctaDestination)) {
      Alert.alert('Invalid Phone Number', 'Enter a valid phone number, e.g. +233241234567');
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = imageUri;
      if (imageUri.startsWith('file:') || imageUri.startsWith('data:') || imageUri.startsWith('blob:')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        const path = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('banner-images').upload(path, blob, {
          contentType: blob.type || 'image/jpeg',
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('banner-images').getPublicUrl(path);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const input = {
        tag,
        title,
        subtitle,
        imageUrl: finalImageUrl,
        ctaLabel,
        ctaRoute: ctaDestination,
        ctaType,
        isActive,
        displayOrder: Number(displayOrder) || 0,
      };

      const mutation = isEditing
        ? new Promise<void>((resolve, reject) => {
            updateBanner.mutate({ id: id as string, input }, { onSuccess: () => resolve(), onError: reject });
          })
        : new Promise<void>((resolve, reject) => {
            createBanner.mutate(input, { onSuccess: () => resolve(), onError: reject });
          });

      await mutation;
      Alert.alert(isEditing ? 'Banner Updated' : 'Banner Created', 'The home screen banner has been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Could Not Save Banner', getErrorMessage(err, 'Please try again.'));
    } finally {
      setIsUploading(false);
    }
  }, [tag, title, subtitle, imageUri, ctaLabel, ctaDestination, ctaType, isActive, displayOrder, isEditing, id, createBanner, updateBanner, router]);

  const isBusy = isUploading || createBanner.isPending || updateBanner.isPending;

  if (isEditing && isLoadingBanner) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.imagePicker} onPress={() => void handlePickImage()}>
        <View ref={dropZoneRef} style={isDragActive && styles.dropZoneActive}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, isDragActive && styles.imagePlaceholderActive]}>
              {isDragActive ? (
                <UploadCloud size={28} color={Colors.orange.primary} />
              ) : (
                <Camera size={28} color={Colors.gray[400]} />
              )}
              <Text style={[styles.imagePlaceholderText, isDragActive && styles.imagePlaceholderTextActive]}>
                {isDragActive ? 'Drop image to upload' : Platform.OS === 'web' ? 'Drag & drop an image, or click to browse' : 'Add Banner Image'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <Field label="Tag (small label above the title)">
        <TextInput style={styles.input} value={tag} onChangeText={setTag} placeholder="e.g. WEEKEND SPECIAL" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Title">
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. 20% Off SUV Rentals" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Subtitle">
        <TextInput style={styles.input} value={subtitle} onChangeText={setSubtitle} placeholder="e.g. Book any SUV this weekend & save big" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Call-to-Action Button Label">
        <TextInput style={styles.input} value={ctaLabel} onChangeText={setCtaLabel} placeholder="e.g. Book Now" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <Field label="Call-to-Action Type">
        <View style={styles.chipRow}>
          {CTA_TYPES.map((opt) => {
            const Icon = opt.icon;
            const isActiveType = ctaType === opt.type;
            return (
              <Pressable
                key={opt.type}
                style={[styles.typeChip, isActiveType && styles.chipActive]}
                onPress={() => handleCtaTypeChange(opt.type)}
                testID={`banner-cta-type-${opt.type}`}
              >
                <Icon size={14} color={isActiveType ? Colors.white : Colors.gray[600]} />
                <Text style={[styles.chipText, isActiveType && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {ctaType === 'route' ? (
        <Field label="Call-to-Action Destination">
          <View style={styles.chipRow}>
            {CTA_ROUTES.map((opt) => (
              <Pressable
                key={opt.route}
                style={[styles.chip, ctaDestination === opt.route && styles.chipActive]}
                onPress={() => setCtaDestination(opt.route)}
              >
                <Text style={[styles.chipText, ctaDestination === opt.route && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
      ) : (
        <Field label={ctaType === 'url' ? 'External URL' : 'Phone Number'}>
          <TextInput
            style={styles.input}
            value={ctaDestination}
            onChangeText={setCtaDestination}
            placeholder={ctaType === 'url' ? 'https://example.com/promo' : '+233241234567'}
            placeholderTextColor={Colors.gray[400]}
            keyboardType={ctaType === 'phone' ? 'phone-pad' : 'url'}
            autoCapitalize="none"
            testID="banner-cta-destination"
          />
        </Field>
      )}
      <Field label="Display Order (lower shows first)">
        <TextInput style={styles.input} value={displayOrder} onChangeText={setDisplayOrder} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} />
      </Field>
      <View style={styles.activeRow}>
        <Text style={styles.fieldLabel}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: Colors.orange.primary }} />
      </View>

      <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={() => void handleSubmit()} disabled={isBusy} testID="banner-submit">
        {isBusy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Create Banner'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingWrap: { flex: 1, backgroundColor: Colors.gray[50], alignItems: 'center' as const, justifyContent: 'center' as const },
  content: { padding: 20, paddingBottom: 60 },
  imagePicker: { marginBottom: 20 },
  previewImage: { width: '100%', height: 160, borderRadius: 16 },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  imagePlaceholderActive: {
    backgroundColor: Colors.orange.faint,
    borderColor: Colors.orange.primary,
  },
  imagePlaceholderText: { color: Colors.gray[400], fontSize: 14, fontWeight: '600' as const, paddingHorizontal: 20, textAlign: 'center' as const },
  imagePlaceholderTextActive: { color: Colors.orange.primary },
  dropZoneActive: { borderRadius: 16 },
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
  chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray[100] },
  typeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  chipActive: { backgroundColor: Colors.orange.primary },
  chipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.gray[700] },
  chipTextActive: { color: Colors.white },
  activeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
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
