import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface InAppCheckoutModalProps {
  visible: boolean;
  checkoutUrl: string | null;
  returnUrlMarker: string;
  onClose: () => void;
}

// Web: reading a cross-origin iframe's location throws, which is exactly
// what happens while Hubtel's checkout page is loaded (expected, not an
// error). Once Hubtel redirects back to our own domain the iframe becomes
// same-origin again, so the read succeeds and we can detect completion and
// close automatically — same end result as the native WebView version.
export default function InAppCheckoutModal({ visible, checkoutUrl, returnUrlMarker, onClose }: InAppCheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    setIsLoading(false);
    try {
      const currentUrl = iframeRef.current?.contentWindow?.location.href;
      if (currentUrl && currentUrl.includes(returnUrlMarker)) {
        onClose();
      }
    } catch {
      // Still on Hubtel's cross-origin checkout page — expected.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} testID="checkout-modal-close">
            <X size={20} color={Colors.gray[700]} />
          </Pressable>
        </View>
        {checkoutUrl &&
          React.createElement('iframe', {
            ref: iframeRef,
            src: checkoutUrl,
            onLoad: handleLoad,
            title: 'Secure Checkout',
            style: { flex: 1, border: 'none', width: '100%', height: '100%' },
          })}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.white,
  },
});
