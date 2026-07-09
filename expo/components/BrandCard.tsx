import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Car } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Brand } from '@/types/car';

interface BrandCardProps {
  brand: Brand;
  onPress: (brand: Brand) => void;
  isSelected?: boolean;
}

export default React.memo(function BrandCard({ brand, onPress, isSelected }: BrandCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(brand)}
      testID={`brand-${brand.id}`}
    >
      <View style={[styles.logoWrap, isSelected && styles.logoWrapSelected]}>
        {logoFailed || !brand.logo ? (
          <Car size={26} color={Colors.gray[400]} />
        ) : (
          <Image
            source={{ uri: brand.logo }}
            style={styles.logo}
            contentFit="contain"
            onError={() => setLogoFailed(true)}
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{brand.name}</Text>
      <Text style={styles.count}>{brand.carCount} Cars</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center' as const,
    width: 80,
    marginRight: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  logoWrapSelected: {
    borderWidth: 2,
    borderColor: Colors.orange.primary,
  },
  logo: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[800],
    marginTop: 6,
    textAlign: 'center' as const,
  },
  count: {
    fontSize: 10,
    color: Colors.gray[500],
    marginTop: 2,
  },
});
