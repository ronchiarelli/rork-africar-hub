import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCars } from '@/lib/queries/cars';
import { useFavorites } from '@/providers/FavoritesProvider';
import { Car } from '@/types/car';

function AnimatedCarCard({ car }: { car: Car }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favorited = isFavorite(car.id);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push({ pathname: '/car-details', params: { id: car.id } })}
      >
        <View style={localStyles.horizontalCard}>
          <View style={localStyles.imageWrap}>
            <Image source={{ uri: car.image }} style={localStyles.image} contentFit="cover" />
            <Pressable onPress={() => toggleFavorite(car.id)} style={localStyles.heartBtn}>
              <Heart
                size={18}
                color={favorited ? Colors.orange.primary : Colors.white}
                fill={favorited ? Colors.orange.primary : 'transparent'}
              />
            </Pressable>
          </View>
          <View style={localStyles.info}>
            <Text style={localStyles.cardBrand}>{car.brand}</Text>
            <Text style={localStyles.cardModel} numberOfLines={1}>{car.model}</Text>
            <View style={localStyles.locationRow}>
              <MapPin size={12} color={Colors.gray[500]} />
              <Text style={localStyles.locationText}>{car.location}</Text>
            </View>
            <View style={localStyles.priceRow}>
              <Text style={localStyles.currency}>GH₵</Text>
              <Text style={localStyles.price}>{car.pricePerDay}</Text>
              <Text style={localStyles.perDay}>/day</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function FavoritesScreen() {
  const { favoriteIds } = useFavorites();
  const { data: cars = [] } = useCars();
  const favoriteCars = cars.filter((c) => favoriteIds.includes(c.id));

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {favoriteCars.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Heart size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on any car to save it here</Text>
          </View>
        ) : (
          favoriteCars.map((car) => (
            <AnimatedCarCard key={car.id} car={car} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
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
  imageWrap: {
    width: 130,
    height: 120,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
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
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center' as const,
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
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginTop: 8,
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 100,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center' as const,
  },
});
