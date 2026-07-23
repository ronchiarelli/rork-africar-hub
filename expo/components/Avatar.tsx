import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import Colors from '@/constants/colors';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ImageStyle;
}

// Shared fallback for every place that shows a user's uploaded photo — a
// plain <Image uri={undefined}> renders blank with no visual feedback, so
// anyone who never uploaded an avatar (the common case) just showed empty
// space. Falls back to a colored circle with their initial, matching the
// initials-avatar look already used for chat/support lists that have no
// photo data at all.
export default function Avatar({ uri, name, size = 44, style }: AvatarProps) {
  const initial = (name?.trim()?.charAt(0) || '?').toUpperCase();
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[dimensionStyle, style]} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle, style]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.purple.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  initial: {
    color: Colors.purple.medium,
    fontWeight: '700' as const,
  },
});
