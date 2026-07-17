import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCars, useBookedCarIds } from '@/lib/queries/cars';
import { useFavorites } from '@/providers/FavoritesProvider';
import CarCard from '@/components/CarCard';
import { getNavBarClearance } from '@/components/BottomNavBar';

export default function FavoritesScreen() {
  const { favoriteIds } = useFavorites();
  const { data: cars = [] } = useCars();
  const { data: bookedCarIds } = useBookedCarIds();
  const favoriteCars = cars.filter((c) => favoriteIds.includes(c.id));
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        {favoriteCars.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Heart size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on any car to save it here</Text>
          </View>
        ) : (
          favoriteCars.map((car) => (
            <CarCard key={car.id} car={car} variant="horizontal" isBooked={bookedCarIds?.has(car.id)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
