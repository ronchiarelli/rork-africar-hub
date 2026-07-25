import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin, Star, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Car } from '@/types/car';
import { useFavorites } from '@/providers/FavoritesProvider';
import { thumbnailUrl } from '@/lib/imageResize';

interface CarCardProps {
  car: Car;
  variant?: 'horizontal' | 'vertical';
  isBooked?: boolean;
  ctaLabel?: string;
}

export default React.memo(function CarCard({ car, variant = 'vertical', isBooked = false, ctaLabel }: CarCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favorited = isFavorite(car.id);
  // Sample/catalog cars (no real owner) aren't actually rentable — always
  // show them as booked regardless of the real booked-today lookup.
  const showBooked = isBooked || car.ownerId === null;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    router.push({ pathname: '/car-details', params: { id: car.id } });
  }, [car.id, router]);

  const handleFavorite = useCallback(() => {
    toggleFavorite(car.id);
  }, [car.id, toggleFavorite]);

  if (variant === 'horizontal') {
    return (
      <Animated.View style={[styles.horizontalCard, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable style={styles.horizontalCardRow} onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} testID={`car-card-${car.id}`}>
          <View style={styles.horizontalImageWrap}>
            <Image source={{ uri: thumbnailUrl(car.image, 130) }} style={styles.horizontalImage} contentFit="cover" />
            <Pressable onPress={handleFavorite} style={styles.heartBtn} testID={`fav-btn-${car.id}`}>
              <Heart
                size={18}
                color={favorited ? Colors.orange.primary : Colors.white}
                fill={favorited ? Colors.orange.primary : 'transparent'}
              />
            </Pressable>
          </View>
          <View style={styles.horizontalInfo}>
            {showBooked && (
              <View style={styles.bookedBadge} testID={`booked-badge-${car.id}`}>
                <Text style={styles.bookedBadgeText}>Booked</Text>
              </View>
            )}
            <Text style={styles.cardBrand}>{car.brand}</Text>
            <Text style={styles.cardModel} numberOfLines={1}>{car.model}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.gray[500]} />
              <Text style={styles.locationText}>{car.location}</Text>
            </View>
            <View style={styles.horizontalBottomRow}>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>GH₵</Text>
                <Text style={styles.price}>{car.pricePerDay}</Text>
                <Text style={styles.perDay}>/day</Text>
              </View>
              {ctaLabel && (
                <Pressable style={styles.ctaBtn} onPress={handlePress} testID={`car-cta-${car.id}`}>
                  <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} testID={`car-card-${car.id}`}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: thumbnailUrl(car.image, 220) }} style={styles.image} contentFit="cover" />
          {car.isFeatured && (
            <View style={styles.featuredBadge}>
              <Sparkles size={10} color={Colors.white} />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          <Pressable onPress={handleFavorite} style={styles.heartBtn} testID={`fav-btn-${car.id}`}>
            <Heart
              size={18}
              color={favorited ? Colors.orange.primary : Colors.white}
              fill={favorited ? Colors.orange.primary : 'transparent'}
            />
          </Pressable>
          <View style={styles.ratingBadge}>
            <Star size={12} color={Colors.star} fill={Colors.star} />
            <Text style={styles.ratingText}>{car.rating}</Text>
          </View>
        </View>
        <View style={styles.info}>
          {showBooked && (
            <View style={styles.bookedBadge} testID={`booked-badge-${car.id}`}>
              <Text style={styles.bookedBadgeText}>Booked</Text>
            </View>
          )}
          <Text style={styles.cardBrand}>{car.brand}</Text>
          <Text style={styles.cardModel} numberOfLines={1}>{car.model}</Text>
          <View style={styles.cardBottom}>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>GH₵</Text>
              <Text style={styles.price}>{car.pricePerDay}</Text>
              <Text style={styles.perDay}>/day</Text>
            </View>
            <View style={styles.arrowBtn}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden' as const,
  },
  imageWrap: {
    width: '100%',
    height: 140,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heartBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  featuredBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  ratingBadge: {
    position: 'absolute' as const,
    bottom: 8,
    left: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bookedBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  bookedBadgeText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  info: {
    padding: 14,
  },
  cardBrand: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  cardModel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  currency: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  price: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
  perDay: {
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 2,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  arrowText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  horizontalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
    flexDirection: 'row' as const,
  },
  horizontalCardRow: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  horizontalImageWrap: {
    width: 130,
    height: 120,
    position: 'relative' as const,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center' as const,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  horizontalBottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  ctaBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
