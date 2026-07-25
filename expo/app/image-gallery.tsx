import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCarDetails, useSaleCarDetails } from '@/lib/queries/cars';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ZoomableImageProps {
  uri: string;
  onZoomChange: (isZoomed: boolean) => void;
}

function ZoomableImage({ uri, onZoomChange }: ZoomableImageProps) {
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);

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
    RNImage.getSize(uri, (width, height) => setImgSize({ width, height }), () => setImgSize({ width: SCREEN_WIDTH, height: SCREEN_WIDTH }));
  }, [uri]);

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

  const fitScale = imgSize ? Math.min(SCREEN_WIDTH / imgSize.width, SCREEN_HEIGHT / imgSize.height) : 1;

  const clampTranslate = useCallback((x: number, y: number, currentScale: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const displayScale = fitScale * currentScale;
    const maxX = Math.max(0, (imgSize.width * displayScale - SCREEN_WIDTH) / 2);
    const maxY = Math.max(0, (imgSize.height * displayScale - SCREEN_HEIGHT) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, [imgSize, fitScale]);

  const handlePanGestureEvent = useCallback((event: any) => {
    if (scaleValue.current <= 1) return;
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
      onZoomChange(baseScale.current > 1);
    }
  }, [onZoomChange]);

  const handleDoubleTap = useCallback(() => {
    const resetting = scaleValue.current > 1;
    baseScale.current = resetting ? 1 : 2;
    baseTranslate.current = { x: 0, y: 0 };
    onZoomChange(!resetting);
    Animated.parallel([
      Animated.timing(scale, { toValue: baseScale.current, duration: 200, useNativeDriver: false }),
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [scale, translateX, translateY, onZoomChange]);

  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      handleDoubleTap();
    }
    lastTap.current = now;
  }, [handleDoubleTap]);

  return (
    <View style={styles.page}>
      {!imgSize ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
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
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }] }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: SCREEN_WIDTH / 2 - (imgSize.width * fitScale) / 2,
                      top: SCREEN_HEIGHT / 2 - (imgSize.height * fitScale) / 2,
                      width: imgSize.width * fitScale,
                      height: imgSize.height * fitScale,
                      transform: [{ scale }],
                    }}
                  >
                    <ExpoImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
                  </Animated.View>
                </Pressable>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      )}
    </View>
  );
}

export default function ImageGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ carId: string; index?: string; type?: 'car' | 'sale_car' }>();
  const isSaleCar = params.type === 'sale_car';
  const { data: car } = useCarDetails(isSaleCar ? undefined : params.carId);
  const { data: saleCar } = useSaleCarDetails(isSaleCar ? params.carId : undefined);
  const images = (isSaleCar ? saleCar?.images : car?.images) ?? [];
  const initialIndex = clamp(Number(params.index ?? 0) || 0, 0, Math.max(0, images.length - 1));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((idx: number) => {
    const clamped = clamp(idx, 0, images.length - 1);
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setCurrentIndex(clamped);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={!isZoomed}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
          setIsZoomed(false);
        }}
      >
        {images.map((img, idx) => (
          <ZoomableImage key={idx} uri={img} onZoomChange={setIsZoomed} />
        ))}
      </ScrollView>

      <Pressable style={styles.closeBtn} onPress={() => router.back()} testID="gallery-close">
        <X size={22} color={Colors.white} />
      </Pressable>

      {images.length > 1 && (
        <View style={styles.counterWrap}>
          <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
        </View>
      )}

      {images.length > 1 && currentIndex > 0 && (
        <Pressable style={[styles.navBtn, styles.navBtnLeft]} onPress={() => goTo(currentIndex - 1)} testID="gallery-prev">
          <ChevronLeft size={24} color={Colors.white} />
        </Pressable>
      )}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <Pressable style={[styles.navBtn, styles.navBtnRight]} onPress={() => goTo(currentIndex + 1)} testID="gallery-next">
          <ChevronRight size={24} color={Colors.white} />
        </Pressable>
      )}

      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === currentIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  counterWrap: {
    position: 'absolute' as const,
    top: 58,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  counterText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  navBtn: {
    position: 'absolute' as const,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  navBtnLeft: {
    left: 12,
  },
  navBtnRight: {
    right: 12,
  },
  dotsRow: {
    position: 'absolute' as const,
    bottom: 40,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
});
