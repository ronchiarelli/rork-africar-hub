import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AppLogoProps {
  size?: number;
}

// The logo artwork has its own white backdrop baked in (no alpha), so on
// dark screens (auth flow) it's wrapped in a white rounded card rather than
// placed directly — otherwise it reads as a stray white box instead of a
// deliberate badge.
export default function AppLogo({ size = 44 }: AppLogoProps) {
  const padding = Math.round(size * 0.14);
  return (
    <View style={[styles.card, { width: size + padding * 2, height: size + padding * 2, borderRadius: (size + padding * 2) / 2, padding }]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
