import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

// A moving-stripe progress bar for uploads where we know work is happening
// but not real byte-level progress (Supabase Storage's client doesn't
// expose upload progress). Use ProgressBar below instead when an actual
// fraction (e.g. "2 of 5 files") is known.
export default function IndeterminateProgressBar({ height = 6 }: { height?: number }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.stripe,
          {
            height,
            borderRadius: height / 2,
            transform: [
              {
                translateX: translateX.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '140%'] }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function ProgressBar({ progress, height = 6 }: { progress: number; height?: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, height, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.gray[200],
    overflow: 'hidden' as const,
  },
  stripe: {
    width: '40%',
    backgroundColor: Colors.orange.primary,
  },
  fill: {
    backgroundColor: Colors.orange.primary,
  },
});
