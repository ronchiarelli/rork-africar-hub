import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { FavoritesProvider } from "@/providers/FavoritesProvider";
import { UserRole } from "@/types/car";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const AUTH_GROUP = ['welcome', 'login', 'register', 'otp-verify'];
const ROLE_GUARDED: Record<string, UserRole> = {
  'fleet-dashboard': 'fleet_owner',
  'dealer-dashboard': 'dealership',
  'admin-dashboard': 'admin',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, currentRole } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = AUTH_GROUP.some((route) => segments[0] === route);
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/welcome');
      return;
    }
    if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)/(home)');
      return;
    }
    if (isLoggedIn && segments[0]) {
      const required = ROLE_GUARDED[segments[0]];
      if (required && currentRole !== required) {
        router.replace('/(tabs)/(home)');
      }
    }
  }, [isLoggedIn, isLoading, segments, router, currentRole]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="car-details" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ title: "Book Car", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="booking-detail" options={{ title: "Booking Details", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="payment" options={{ title: "Payment", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="favorites" options={{ title: "My Favorites", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="kyc-verification" options={{ title: "KYC Verification", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="marketplace" options={{ title: "Marketplace", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="help-support" options={{ title: "Help & Support", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="wallet" options={{ title: "My Wallet", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="review" options={{ title: "Write a Review", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="fleet-dashboard" options={{ title: "Fleet Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="dealer-dashboard" options={{ title: "Dealer Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="admin-dashboard" options={{ title: "Admin Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <FavoritesProvider>
            <AuthGuard>
              <RootLayoutNav />
            </AuthGuard>
          </FavoritesProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
