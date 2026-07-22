import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

interface InAppCheckoutModalProps {
  visible: boolean;
  checkoutUrl: string | null;
  returnUrlMarker: string;
  onClose: () => void;
}

// Native: a WebView's navigation state is readable regardless of origin
// (unlike a web <iframe>, no same-origin restriction applies), so we can
// detect the moment Hubtel redirects back to our own return URL and close
// automatically instead of leaving the user stuck looking at our own page
// rendered inside the checkout modal.
export default function InAppCheckoutModal({ visible, checkoutUrl, returnUrlMarker, onClose }: InAppCheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.url.includes(returnUrlMarker)) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} testID="checkout-modal-close">
            <X size={20} color={Colors.gray[700]} />
          </Pressable>
        </View>
        {checkoutUrl && (
          <WebView
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
          />
        )}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.orange.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.gray[900] },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.white,
  },
});
