import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Image as RNImage,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUploadKycPhoto } from '@/lib/queries/kyc';
import { getErrorMessage } from '@/lib/errors';
import IndeterminateProgressBar from '@/components/IndeterminateProgressBar';
import type { KycDocTypeDb, KycDocSideDb } from '@/types/database';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Landscape card ratio (Ghana Card / Driver's License) vs. a passport's
// portrait photo page — matches what each document actually looks like so
// the crop frame isn't fighting the user's photo.
const ASPECT_BY_TYPE: Record<KycDocTypeDb, number> = {
  ghana_card: 1.586,
  drivers_license: 1.586,
  passport: 0.72,
  selfie: 1,
};

const MAX_FRAME_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
// Reserve space for the title bar, hint text, and bottom action bar so a
// portrait (passport) frame can't grow taller than what's actually left on
// screen — fitting only to width previously produced a frame ~500pt tall
// regardless of available height, overflowing on shorter devices.
const MAX_FRAME_HEIGHT = SCREEN_HEIGHT - 260;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fitFrameSize(aspect: number): { width: number; height: number } {
  let width = MAX_FRAME_WIDTH;
  let height = width / aspect;
  if (height > MAX_FRAME_HEIGHT) {
    height = MAX_FRAME_HEIGHT;
    width = height * aspect;
  }
  return { width, height };
}

export default function CropImageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri: string; type: KycDocTypeDb; side: KycDocSideDb }>();
  const { uri, type, side } = params;
  const aspect = ASPECT_BY_TYPE[type] ?? 1.586;
  const frameSize = fitFrameSize(aspect);

  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadPhoto = useUploadKycPhoto();

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(1);
  const translateValue = useRef({ x: 0, y: 0 });
  const baseScale = useRef(1);
  const baseTranslate = useRef({ x: 0, y: 0 });

  const panRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    if (!uri) return;
    RNImage.getSize(
      uri,
      (width, height) => setImgSize({ width, height }),
      () => Alert.alert('Error', 'Could not load this image. Please try again.', [{ text: 'OK', onPress: () => router.back() }])
    );
  }, [uri, router]);

  useEffect(() => {
    const idX = translateX.addListener(({ value }) => { translateValue.current.x = value; });
    const idY = translateY.addListener(({ value }) => { translateValue.current.y = value; });
    const idS = scale.addListener(({ value }) => { scaleValue.current = value; });
    return () => {
      translateX.removeListener(idX);
      translateY.removeListener(idY);
      scale.removeListener(idS);
    };
  }, [translateX, translateY, scale]);

  const coverScale = imgSize ? Math.max(frameSize.width / imgSize.width, frameSize.height / imgSize.height) : 1;

  const clampTranslate = useCallback((x: number, y: number, currentScale: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const displayScale = coverScale * currentScale;
    const maxX = Math.max(0, (imgSize.width * displayScale - frameSize.width) / 2);
    const maxY = Math.max(0, (imgSize.height * displayScale - frameSize.height) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, [imgSize, coverScale, frameSize.width, frameSize.height]);

  // Plain (non-native-driver) gesture handling — simpler to reason about
  // than composing Animated.event across two simultaneous handlers, and
  // performant enough for panning/zooming a single static image.
  const handlePanGestureEvent = useCallback((event: any) => {
    const { translationX, translationY } = event.nativeEvent;
    const next = clampTranslate(baseTranslate.current.x + translationX, baseTranslate.current.y + translationY, scaleValue.current);
    translateX.setValue(next.x);
    translateY.setValue(next.y);
  }, [clampTranslate, translateX, translateY]);

  const handlePanStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseTranslate.current = { x: translateValue.current.x, y: translateValue.current.y };
    }
  }, []);

  const handlePinchGestureEvent = useCallback((event: any) => {
    const nextScale = clamp(baseScale.current * event.nativeEvent.scale, MIN_SCALE, MAX_SCALE);
    scale.setValue(nextScale);
    const next = clampTranslate(translateValue.current.x, translateValue.current.y, nextScale);
    translateX.setValue(next.x);
    translateY.setValue(next.y);
  }, [clampTranslate, scale, translateX, translateY]);

  const handlePinchStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseScale.current = scaleValue.current;
      baseTranslate.current = { x: translateValue.current.x, y: translateValue.current.y };
    }
  }, []);

  const handleReset = useCallback(() => {
    baseScale.current = 1;
    baseTranslate.current = { x: 0, y: 0 };
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [scale, translateX, translateY]);

  const handleConfirm = useCallback(async () => {
    if (!imgSize || !uri) return;
    setIsProcessing(true);
    try {
      const displayScale = coverScale * scaleValue.current;
      const imgTopLeftX = frameSize.width / 2 + translateValue.current.x - (imgSize.width * displayScale) / 2;
      const imgTopLeftY = frameSize.height / 2 + translateValue.current.y - (imgSize.height * displayScale) / 2;

      const originX = Math.round(clamp(-imgTopLeftX / displayScale, 0, imgSize.width));
      const originY = Math.round(clamp(-imgTopLeftY / displayScale, 0, imgSize.height));
      // Rounding origin can push it flush against the far edge on extreme
      // pans/zooms — floor so width/height never go zero or negative, which
      // would otherwise make manipulateAsync reject the crop outright.
      const cropWidth = Math.max(1, Math.round(Math.min(frameSize.width / displayScale, imgSize.width - originX)));
      const cropHeight = Math.max(1, Math.round(Math.min(frameSize.height / displayScale, imgSize.height - originY)));

      const result = await manipulateAsync(
        uri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      uploadPhoto.mutate(
        { uri: result.uri, type, side },
        {
          onSuccess: () => {
            router.back();
            // Fires after the pop completes — the doc card the user just
            // uploaded has already disappeared (no more action needed until
            // admin review), which with no confirmation reads as "nothing
            // happened" rather than success.
            setTimeout(() => Alert.alert('Uploaded', 'Your photo was submitted and is now under review.'), 300);
          },
          onError: (err) => Alert.alert('Upload Failed', getErrorMessage(err, 'Please try again.')),
          onSettled: () => setIsProcessing(false),
        }
      );
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Crop Failed', getErrorMessage(err, 'Could not process this image. Please try again.'));
    }
  }, [imgSize, uri, coverScale, frameSize, type, side, uploadPhoto, router]);

  const isBusy = isProcessing || uploadPhoto.isPending;

  return (
    <View style={styles.container}>
      <Pressable style={[styles.closeBtn, { top: insets.top + 10 }]} onPress={() => router.back()} disabled={isBusy} testID="crop-close">
        <X size={22} color={Colors.white} />
      </Pressable>

      <Text style={[styles.title, { top: insets.top + 16 }]}>Adjust Photo</Text>

      <View style={styles.centerWrap}>
        {!imgSize ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View style={[styles.frame, frameSize]}>
            <PanGestureHandler
              ref={panRef}
              simultaneousHandlers={pinchRef}
              onGestureEvent={handlePanGestureEvent}
              onHandlerStateChange={handlePanStateChange}
            >
              <Animated.View style={StyleSheet.absoluteFill}>
                <PinchGestureHandler
                  ref={pinchRef}
                  simultaneousHandlers={panRef}
                  onGestureEvent={handlePinchGestureEvent}
                  onHandlerStateChange={handlePinchStateChange}
                >
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        transform: [
                          { translateX },
                          { translateY },
                        ],
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        position: 'absolute',
                        left: frameSize.width / 2 - (imgSize.width * coverScale) / 2,
                        top: frameSize.height / 2 - (imgSize.height * coverScale) / 2,
                        width: imgSize.width * coverScale,
                        height: imgSize.height * coverScale,
                        transform: [{ scale }],
                      }}
                    >
                      <ExpoImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
                    </Animated.View>
                  </Animated.View>
                </PinchGestureHandler>
              </Animated.View>
            </PanGestureHandler>
          </View>
        )}
      </View>

      <Text style={styles.hint}>Pinch to zoom, drag to reposition</Text>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        {isBusy && (
          <View style={styles.progressWrap}>
            <IndeterminateProgressBar />
          </View>
        )}
        <View style={styles.actionsRow}>
          <Pressable style={styles.resetBtn} onPress={handleReset} disabled={isBusy || !imgSize} testID="crop-reset">
            <RotateCcw size={18} color={Colors.white} />
            <Text style={styles.actionText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={() => void handleConfirm()} disabled={isBusy || !imgSize} testID="crop-confirm">
            {isBusy ? <ActivityIndicator color={Colors.white} /> : <Check size={18} color={Colors.white} />}
            <Text style={styles.actionText}>{isBusy ? 'Uploading…' : 'Use Photo'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  closeBtn: {
    position: 'absolute' as const,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  title: {
    position: 'absolute' as const,
    alignSelf: 'center' as const,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  frame: {
    overflow: 'hidden' as const,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.orange.primary,
    backgroundColor: '#111',
  },
  hint: {
    color: Colors.gray[400],
    fontSize: 13,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  bottomBar: {
    paddingHorizontal: 24,
    gap: 12,
  },
  progressWrap: {
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
