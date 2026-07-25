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
  PanResponder,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, UploadCloud, Link2, Phone, Navigation, Move, RotateCcw, LayoutTemplate, Image as ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import { useBanner, useAllBanners, useCreateBanner, useUpdateBanner } from '@/lib/queries/banners';
import { getErrorMessage } from '@/lib/errors';
import { uploadImageAsync, extensionFromUri } from '@/lib/imageUpload';
import IndeterminateProgressBar from '@/components/IndeterminateProgressBar';
import type { BannerCtaTypeDb, BannerLayoutDb } from '@/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// The banner placeholder never displays wider than the screen itself, so
// anything beyond ~2x that (for retina-ish sharpness) is wasted upload/
// download weight with zero visible benefit — downscale before upload
// instead of shipping the phone camera's full-resolution original.
const MAX_BANNER_WIDTH = 1200;

async function resizeForBannerUpload(uri: string): Promise<string> {
  const originalWidth = await new Promise<number>((resolve) => {
    RNImage.getSize(
      uri,
      (width) => resolve(width),
      () => resolve(0),
    );
  });
  if (!originalWidth || originalWidth <= MAX_BANNER_WIDTH) return uri;
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_BANNER_WIDTH } }],
    { compress: 0.85, format: SaveFormat.JPEG },
  );
  return result.uri;
}

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

const LAYOUT_OPTIONS: { type: BannerLayoutDb; label: string; description: string; icon: typeof LayoutTemplate }[] = [
  { type: 'template', label: 'Template', description: 'Tag, title & subtitle overlaid next to your image', icon: LayoutTemplate },
  { type: 'full_image', label: 'Fully Designed', description: 'Your image fills the entire banner — only the CTA button is added', icon: ImageIcon },
];

// Matches the actual banner display's image slot (140x150 in
// app/(tabs)/(home)/index.tsx's promoImage style) so repositioning here is
// a true preview of what will show on the home screen.
const CROP_FRAME_ASPECT_RATIO = 140 / 150;
// Full-image layout fills the whole banner box instead of just the side
// slot — matches promoBanner's own dimensions (screen width minus its
// 20px horizontal margins, minHeight 150) in home/index.tsx.
const FULL_IMAGE_ASPECT_RATIO = (SCREEN_WIDTH - 40) / 150;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

interface ImageCropFrameProps {
  imageUri: string;
  focalX: number;
  focalY: number;
  aspectRatio: number;
  onFocalChange: (x: number, y: number) => void;
}

// Lets the admin drag the image within its fixed display frame to choose
// the focal point, mirroring expo-image's contentPosition percentage
// semantics directly (0-100 on each axis) so the same value drives both
// this preview and the real banner render on the home screen.
function ImageCropFrame({ imageUri, focalX, focalY, aspectRatio, onFocalChange }: ImageCropFrameProps) {
  const frameSize = useRef({ width: 0, height: 0 });
  const startFocal = useRef({ x: focalX, y: focalY });
  const focalRef = useRef({ x: focalX, y: focalY });

  useEffect(() => {
    focalRef.current = { x: focalX, y: focalY };
  }, [focalX, focalY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        startFocal.current = { ...focalRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const { width, height } = frameSize.current;
        if (!width || !height) return;
        const nextX = clamp(startFocal.current.x - (gesture.dx / width) * 100, 0, 100);
        const nextY = clamp(startFocal.current.y - (gesture.dy / height) * 100, 0, 100);
        onFocalChange(nextX, nextY);
      },
    })
  ).current;

  return (
    <View
      style={[styles.cropFrame, { aspectRatio }]}
      onLayout={(e) => {
        frameSize.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
      }}
      {...panResponder.panHandlers}
      testID="banner-crop-frame"
    >
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ left: `${focalX}%`, top: `${focalY}%` }}
      />
      <View style={styles.cropFrameHint} pointerEvents="none">
        <Move size={14} color={Colors.white} />
        <Text style={styles.cropFrameHintText}>Drag to reposition</Text>
      </View>
    </View>
  );
}

export default function AddBannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { data: existingBanner, isLoading: isLoadingBanner } = useBanner(id);
  const { data: allBanners = [], isLoading: isLoadingAllBanners } = useAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [layout, setLayout] = useState<BannerLayoutDb>('template');
  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Book Now');
  const [ctaType, setCtaType] = useState<BannerCtaTypeDb>('route');
  const [ctaDestination, setCtaDestination] = useState(CTA_ROUTES[0].route);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const hasAutoSetOrder = useRef(false);
  const dropZoneRef = useRef<View>(null);

  useEffect(() => {
    if (!existingBanner) return;
    setImageUri(existingBanner.imageUrl);
    setLayout(existingBanner.layout);
    setTag(existingBanner.tag);
    setTitle(existingBanner.title);
    setSubtitle(existingBanner.subtitle);
    setCtaLabel(existingBanner.ctaLabel);
    setCtaType(existingBanner.ctaType);
    setCtaDestination(existingBanner.ctaRoute);
    setFocalX(existingBanner.focalX);
    setFocalY(existingBanner.focalY);
    setIsActive(existingBanner.isActive);
    setDisplayOrder(String(existingBanner.displayOrder));
  }, [existingBanner]);

  // New banners default to the back of the queue instead of admin having
  // to guess a number — lower display_order shows first, so one past the
  // current highest keeps existing banners' order untouched. Still
  // editable below in case the admin wants to reorder or bump it forward.
  useEffect(() => {
    if (isEditing || hasAutoSetOrder.current || isLoadingAllBanners) return;
    const maxOrder = allBanners.length > 0 ? Math.max(...allBanners.map((b) => b.displayOrder)) : -1;
    setDisplayOrder(String(maxOrder + 1));
    hasAutoSetOrder.current = true;
  }, [isEditing, allBanners, isLoadingAllBanners]);

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
      const resizedUri = await resizeForBannerUpload(result.assets[0].uri);
      setImageUri(resizedUri);
      setFocalX(50);
      setFocalY(50);
    }
  }, []);

  const handleCtaTypeChange = useCallback((type: BannerCtaTypeDb) => {
    setCtaType(type);
    if (type === 'route') setCtaDestination(CTA_ROUTES[0].route);
    else setCtaDestination('');
  }, []);

  const handleResetPosition = useCallback(() => {
    setFocalX(50);
    setFocalY(50);
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
        void resizeForBannerUpload(URL.createObjectURL(file)).then((resizedUri) => {
          setImageUri(resizedUri);
          setFocalX(50);
          setFocalY(50);
        });
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
    if (layout === 'template' && (!tag || !title || !subtitle)) {
      Alert.alert('Missing Info', 'Please fill in the tag, title, and subtitle, or switch to the Fully Designed layout.');
      return;
    }
    if (!ctaLabel || !imageUri || !ctaDestination) {
      Alert.alert('Missing Info', 'Add an image, a call-to-action label, and set a call-to-action destination.');
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
        const path = `${Date.now()}.${extensionFromUri(imageUri)}`;
        finalImageUrl = await uploadImageAsync('banner-images', path, imageUri);
      }

      const input = {
        tag: layout === 'full_image' ? '' : tag,
        title: layout === 'full_image' ? '' : title,
        subtitle: layout === 'full_image' ? '' : subtitle,
        imageUrl: finalImageUrl,
        ctaLabel,
        ctaRoute: ctaDestination,
        ctaType,
        layout,
        focalX,
        focalY,
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
  }, [layout, tag, title, subtitle, imageUri, ctaLabel, ctaDestination, ctaType, focalX, focalY, isActive, displayOrder, isEditing, id, createBanner, updateBanner, router]);

  const isBusy = isUploading || createBanner.isPending || updateBanner.isPending;

  if (isEditing && isLoadingBanner) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
      <Field label="Banner Layout">
        <View style={styles.layoutOptionsWrap}>
          {LAYOUT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActiveLayout = layout === opt.type;
            return (
              <Pressable
                key={opt.type}
                style={[styles.layoutOption, isActiveLayout && styles.layoutOptionActive]}
                onPress={() => setLayout(opt.type)}
                testID={`banner-layout-${opt.type}`}
              >
                <Icon size={18} color={isActiveLayout ? Colors.orange.primary : Colors.gray[500]} />
                <Text style={[styles.layoutOptionLabel, isActiveLayout && styles.layoutOptionLabelActive]}>{opt.label}</Text>
                <Text style={styles.layoutOptionDescription}>{opt.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <View ref={dropZoneRef} style={styles.imagePicker}>
        {imageUri ? (
          <>
            <ImageCropFrame
              imageUri={imageUri}
              focalX={focalX}
              focalY={focalY}
              aspectRatio={layout === 'full_image' ? FULL_IMAGE_ASPECT_RATIO : CROP_FRAME_ASPECT_RATIO}
              onFocalChange={(x, y) => {
                setFocalX(x);
                setFocalY(y);
              }}
            />
            <View style={styles.imageActionsRow}>
              <Pressable style={styles.imageActionBtn} onPress={() => void handlePickImage()} testID="banner-change-image">
                <Camera size={14} color={Colors.gray[700]} />
                <Text style={styles.imageActionText}>Change Image</Text>
              </Pressable>
              <Pressable style={styles.imageActionBtn} onPress={handleResetPosition} testID="banner-reset-position">
                <RotateCcw size={14} color={Colors.gray[700]} />
                <Text style={styles.imageActionText}>Reset Position</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => void handlePickImage()}>
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
          </Pressable>
        )}
        {isDragActive && imageUri && (
          <View style={styles.dropOverlay} pointerEvents="none">
            <UploadCloud size={26} color={Colors.white} />
            <Text style={styles.dropOverlayText}>Drop to replace image</Text>
          </View>
        )}
      </View>

      {layout === 'template' ? (
        <>
          <Field label="Tag (small label above the title)">
            <TextInput style={styles.input} value={tag} onChangeText={setTag} placeholder="e.g. WEEKEND SPECIAL" placeholderTextColor={Colors.gray[400]} />
          </Field>
          <Field label="Title">
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. 20% Off SUV Rentals" placeholderTextColor={Colors.gray[400]} />
          </Field>
          <Field label="Subtitle">
            <TextInput style={styles.input} value={subtitle} onChangeText={setSubtitle} placeholder="e.g. Book any SUV this weekend & save big" placeholderTextColor={Colors.gray[400]} />
          </Field>
        </>
      ) : (
        <Text style={styles.fullImageHint}>
          Your image fills the entire banner — no tag, title, or subtitle is shown on top. The call-to-action button below is still required.
        </Text>
      )}
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
      <Field label={isEditing ? 'Display Order (lower shows first)' : 'Display Order (auto-set to the back of the queue — edit to reorder)'}>
        <TextInput style={styles.input} value={displayOrder} onChangeText={setDisplayOrder} keyboardType="number-pad" placeholderTextColor={Colors.gray[400]} testID="banner-display-order" />
      </Field>
      <View style={styles.activeRow}>
        <Text style={styles.fieldLabel}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: Colors.orange.primary }} />
      </View>

      {isBusy && (
        <View style={styles.progressWrap}>
          <IndeterminateProgressBar />
          <Text style={styles.progressText}>{isUploading ? 'Uploading image…' : 'Saving banner…'}</Text>
        </View>
      )}

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
  imagePicker: { marginBottom: 20, position: 'relative' as const },
  cropFrame: {
    width: '100%',
    aspectRatio: CROP_FRAME_ASPECT_RATIO,
    borderRadius: 16,
    overflow: 'hidden' as const,
    backgroundColor: Colors.gray[900],
    position: 'relative' as const,
  },
  cropFrameHint: {
    position: 'absolute' as const,
    bottom: 10,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cropFrameHintText: { color: Colors.white, fontSize: 12, fontWeight: '600' as const },
  imageActionsRow: { flexDirection: 'row' as const, gap: 8, marginTop: 10 },
  imageActionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingVertical: 10,
  },
  imageActionText: { fontSize: 13, fontWeight: '600' as const, color: Colors.gray[700] },
  dropOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,107,44,0.85)',
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  dropOverlayText: { color: Colors.white, fontSize: 14, fontWeight: '700' as const },
  progressWrap: { marginTop: 16, gap: 8 },
  progressText: { fontSize: 13, color: Colors.gray[600], textAlign: 'center' as const, fontWeight: '600' as const },
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
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.gray[700], marginBottom: 8 },
  layoutOptionsWrap: { flexDirection: 'row' as const, gap: 10 },
  layoutOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  layoutOptionActive: {
    borderColor: Colors.orange.primary,
    backgroundColor: Colors.orange.faint,
  },
  layoutOptionLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.gray[700], marginTop: 2 },
  layoutOptionLabelActive: { color: Colors.orange.primary },
  layoutOptionDescription: { fontSize: 11, color: Colors.gray[500], lineHeight: 15 },
  fullImageHint: {
    fontSize: 13,
    color: Colors.gray[600],
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    lineHeight: 19,
  },
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
