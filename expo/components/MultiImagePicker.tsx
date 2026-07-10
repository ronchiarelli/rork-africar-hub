import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, X, Star, UploadCloud } from 'lucide-react-native';
import Colors from '@/constants/colors';

const MAX_IMAGES = 10;
const THUMB_SIZE = 84;

interface MultiImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function MultiImagePicker({ images, onChange }: MultiImagePickerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dropZoneRef = useRef<View>(null);

  const handlePickImages = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to add car photos.');
      return;
    }
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (!result.canceled && result.assets.length > 0) {
      onChange([...images, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
    }
  }, [images, onChange]);

  const handleRemove = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  const handleSetCover = useCallback((index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    onChange(next);
  }, [images, onChange]);

  // Drag-and-drop of one or more files on web, same pattern used for the
  // promo banner editor — react-native-web renders View as a real <div>,
  // so native drag/drop listeners are attached via ref.
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
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;
      const remaining = MAX_IMAGES - images.length;
      const urls = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
      onChange([...images, ...urls].slice(0, MAX_IMAGES));
    };

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);
    return () => {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  return (
    <View ref={dropZoneRef} style={[styles.wrap, isDragActive && styles.wrapActive]}>
      <View style={styles.grid}>
        {images.map((uri, index) => (
          <View key={uri + index} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            {index === 0 ? (
              <View style={styles.coverBadge}>
                <Star size={10} color={Colors.white} fill={Colors.white} />
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
            ) : (
              <Pressable style={styles.setCoverBtn} onPress={() => handleSetCover(index)} testID={`set-cover-${index}`}>
                <Star size={12} color={Colors.white} />
              </Pressable>
            )}
            <Pressable style={styles.removeBtn} onPress={() => handleRemove(index)} testID={`remove-image-${index}`}>
              <X size={12} color={Colors.white} />
            </Pressable>
          </View>
        ))}
        {images.length < MAX_IMAGES && (
          <Pressable style={styles.addTile} onPress={() => void handlePickImages()} testID="add-images-btn">
            {isDragActive ? (
              <UploadCloud size={22} color={Colors.orange.primary} />
            ) : images.length === 0 ? (
              <Camera size={22} color={Colors.gray[400]} />
            ) : (
              <Plus size={22} color={Colors.gray[400]} />
            )}
            <Text style={styles.addTileText}>
              {images.length === 0 ? 'Add Photos' : 'Add More'}
            </Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.hint}>
        {images.length}/{MAX_IMAGES} photos{images.length > 1 ? ' · first photo is the cover image' : ''}
        {Platform.OS === 'web' ? ' · drag & drop supported' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 4,
  },
  wrapActive: {
    backgroundColor: Colors.orange.faint,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  thumb: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute' as const,
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 3,
    backgroundColor: Colors.orange.primary,
    borderRadius: 8,
    paddingVertical: 2,
  },
  coverBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '700' as const },
  setCoverBtn: {
    position: 'absolute' as const,
    bottom: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeBtn: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
  },
  addTileText: { color: Colors.gray[400], fontSize: 10, fontWeight: '600' as const },
  hint: { color: Colors.gray[500], fontSize: 12, marginTop: 8 },
});
