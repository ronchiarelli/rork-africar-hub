import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoriteIds, useToggleFavorite } from '@/lib/queries/favorites';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { data: favoriteIds = [] } = useFavoriteIds(userId);
  const toggle = useToggleFavorite(userId);

  const isFavorite = useCallback(
    (carId: string) => favoriteIds.includes(carId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((carId: string) => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to save favorites.');
      return;
    }
    toggle.mutate({ carId, isFavorited: isFavorite(carId) });
  }, [userId, isFavorite, toggle]);

  return useMemo(() => ({ favoriteIds, toggleFavorite, isFavorite }), [favoriteIds, toggleFavorite, isFavorite]);
});
