import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { UserRole, UserProfile } from '@/types/car';
import { mockUser, mockFleetOwner, mockDealer, mockAdmin } from '@/mocks/cars';

const ROLE_KEY = 'autoride_user_role';
const AUTH_KEY = 'autoride_is_logged_in';

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  customer: mockUser,
  fleet_owner: mockFleetOwner,
  dealership: mockDealer,
  admin: mockAdmin,
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedRole, storedAuth] = await Promise.all([
          AsyncStorage.getItem(ROLE_KEY),
          AsyncStorage.getItem(AUTH_KEY),
        ]);
        if (storedRole && (storedRole === 'customer' || storedRole === 'fleet_owner' || storedRole === 'dealership' || storedRole === 'admin')) {
          setCurrentRole(storedRole as UserRole);
        }
        if (storedAuth === 'true') {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.log('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    console.log('Switching role to:', role);
    setCurrentRole(role);
    try {
      await AsyncStorage.setItem(ROLE_KEY, role);
    } catch (e) {
      console.log('Failed to persist role', e);
    }
  }, []);

  const login = useCallback(async () => {
    console.log('User logged in');
    setIsLoggedIn(true);
    try {
      await AsyncStorage.setItem(AUTH_KEY, 'true');
    } catch (e) {
      console.log('Failed to persist auth state', e);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('User logged out');
    setIsLoggedIn(false);
    try {
      await AsyncStorage.setItem(AUTH_KEY, 'false');
    } catch (e) {
      console.log('Failed to persist auth state', e);
    }
  }, []);

  const currentUser = useMemo(() => ROLE_PROFILES[currentRole], [currentRole]);

  return useMemo(() => ({
    currentRole,
    currentUser,
    switchRole,
    isLoading,
    isLoggedIn,
    login,
    logout,
  }), [currentRole, currentUser, switchRole, isLoading, isLoggedIn, login, logout]);
});
