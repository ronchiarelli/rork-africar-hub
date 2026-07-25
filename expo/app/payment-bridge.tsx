import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

// Hubtel's ReturnUrl/CancellationUrl must be a real https:// URL — it
// rejects custom app schemes outright with a 400 "Return URL is invalid".
// But expo-web-browser's openAuthSessionAsync on iOS only reliably detects
// completion via a custom URL scheme (the https-callback API added in iOS
// 17.4 needs an Associated Domains/webcredentials entitlement and a hosted
// apple-app-site-association file, neither of which this project has set
// up). This page is the bridge: Hubtel redirects the in-app browser here
// (a real https page, satisfying Hubtel's validation), and it immediately
// forwards to the app's own gocarhub:// scheme with the same query string
// — which ASWebAuthenticationSession (and the equivalent Android Custom
// Tabs redirect activity) intercepts before it ever reaches a real
// deep-link handler, resolving openAuthSessionAsync's promise.
export default function PaymentBridgeScreen() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.location.href = `gocarhub://payment-return${window.location.search}`;
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color={Colors.orange.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.white,
  },
});
