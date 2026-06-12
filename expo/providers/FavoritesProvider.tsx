import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const FAVORITES_KEY = 'autoride_favorites';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          setFavoriteIds(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load favorites', e);
      }
    };
    void load();
  }, []);

  const persist = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    } catch (e) {
      console.log('Failed to persist favorites', e);
    }
  }, []);

  const toggleFavorite = useCallback((carId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(carId)
        ? prev.filter((id) => id !== carId)
        : [...prev, carId];
      void persist(next);
      return next;
    });
  }, [persist]);

  const isFavorite = useCallback(
    (carId: string) => favoriteIds.includes(carId),
    [favoriteIds]
  );

  return useMemo(() => ({ favoriteIds, toggleFavorite, isFavorite }), [favoriteIds, toggleFavorite, isFavorite]);
});
