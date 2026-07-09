import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { View, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { FavoritesProvider } from "@/providers/FavoritesProvider";
import { useSubscription } from "@/lib/queries/subscriptions";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";
import BottomNavBar from "@/components/BottomNavBar";
import { UserRole } from "@/types/car";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const AUTH_GROUP = ['welcome', 'login', 'register'];
const PUBLIC_STACK_ROUTES = ['car-details', 'terms', 'privacy', 'forgot-password', 'reset-password'];
const PUBLIC_TAB_SEGMENTS = ['(home)', 'search'];
const ROLE_GUARDED: Record<string, UserRole> = {
  'fleet-dashboard': 'fleet_owner',
  'add-car': 'fleet_owner',
  'dealer-dashboard': 'dealership',
  'add-sale-car': 'dealership',
  'admin-dashboard': 'admin',
  'add-banner': 'admin',
  'admin-user-detail': 'admin',
};

function isPublicRoute(segments: readonly string[]): boolean {
  if (AUTH_GROUP.includes(segments[0])) return true;
  if (PUBLIC_STACK_ROUTES.includes(segments[0])) return true;
  if (segments[0] === '(tabs)' && PUBLIC_TAB_SEGMENTS.includes(segments[1])) return true;
  return false;
}

const SUBSCRIPTION_GATED_ROUTES = ['fleet-dashboard', 'add-car', 'dealer-dashboard', 'add-sale-car'];
const WALLET_ALLOWED_ROLES: UserRole[] = ['fleet_owner', 'dealership'];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, currentRole, currentUser, logout } = useAuth();
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const segments = useSegments();
  const router = useRouter();
  const pushRegisteredForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id || pushRegisteredForUserId.current === currentUser.id) return;
    pushRegisteredForUserId.current = currentUser.id;
    void registerForPushNotificationsAsync(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = AUTH_GROUP.some((route) => segments[0] === route);
    if (!isLoggedIn && !isPublicRoute(segments)) {
      router.replace('/welcome');
      return;
    }
    if (isLoggedIn && currentUser?.isSuspended) {
      void logout();
      router.replace('/welcome');
      Alert.alert('Account Suspended', 'Your account has been suspended. Please contact support if you believe this is a mistake.');
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
        return;
      }
      if (segments[0] === 'wallet' && !WALLET_ALLOWED_ROLES.includes(currentRole)) {
        router.replace('/(tabs)/(home)');
        return;
      }
      if (
        SUBSCRIPTION_GATED_ROUTES.includes(segments[0]) &&
        !isSubscriptionLoading &&
        !subscription?.isActive
      ) {
        router.replace('/subscription');
      }
    }
  }, [isLoggedIn, isLoading, segments, router, currentRole, currentUser, logout, subscription, isSubscriptionLoading]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const segments = useSegments();
  const showNavBar = !AUTH_GROUP.includes(segments[0]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerBackTitle: "Back" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="car-details" options={{ headerShown: false }} />
          <Stack.Screen name="booking" options={{ title: "Book Car", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="booking-detail" options={{ title: "Booking Details", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="favorites" options={{ title: "My Favorites", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="messages" options={{ title: "Messages", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="chat" options={{ title: "Chat", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="kyc-verification" options={{ title: "KYC Verification", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="marketplace" options={{ title: "Marketplace", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: "Settings", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="terms" options={{ title: "Terms of Service", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="privacy" options={{ title: "Privacy Policy", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="help-support" options={{ title: "Help & Support", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="wallet" options={{ title: "My Wallet", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="review" options={{ title: "Write a Review", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="fleet-dashboard" options={{ title: "Fleet Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="add-car" options={{ title: "List a Car", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="add-sale-car" options={{ title: "List a Car for Sale", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="dealer-dashboard" options={{ title: "Dealer Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="admin-dashboard" options={{ title: "Admin Dashboard", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="add-banner" options={{ title: "Home Banner", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="admin-user-detail" options={{ title: "User Details", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="subscription" options={{ title: "Subscription", headerStyle: { backgroundColor: '#1A0A2E' }, headerTintColor: '#fff' }} />
        </Stack>
      </View>
      {showNavBar && <BottomNavBar />}
    </View>
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
