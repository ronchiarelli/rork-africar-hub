import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RotateCcw, Check, Camera as CameraIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUploadKycPhoto } from '@/lib/queries/kyc';
import { getErrorMessage } from '@/lib/errors';
import IndeterminateProgressBar from '@/components/IndeterminateProgressBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GUIDE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);
const GUIDE_TOP = SCREEN_HEIGHT * 0.28;

export default function SelfieCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const uploadPhoto = useUploadKycPhoto();

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (err) {
      Alert.alert('Camera Error', getErrorMessage(err, 'Could not take the photo. Please try again.'));
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const handleRetake = useCallback(() => setCapturedUri(null), []);

  const handleConfirm = useCallback(() => {
    if (!capturedUri) return;
    uploadPhoto.mutate(
      { uri: capturedUri, type: 'selfie', side: 'single' },
      {
        onSuccess: () => router.back(),
        onError: (err) => Alert.alert('Upload Failed', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [capturedUri, uploadPhoto, router]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 20 }]}>
        <CameraIcon size={40} color={Colors.gray[400]} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>Allow camera access to take your selfie for identity verification.</Text>
        <Pressable style={styles.permissionBtn} onPress={() => void requestPermission()} testID="selfie-request-permission">
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </Pressable>
        <Pressable style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        {uploadPhoto.isPending && (
          <View style={[styles.uploadProgressWrap, { top: insets.top + 16 }]}>
            <IndeterminateProgressBar />
          </View>
        )}
        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={styles.retakeBtn} onPress={handleRetake} disabled={uploadPhoto.isPending} testID="selfie-retake">
            <RotateCcw size={20} color={Colors.white} />
            <Text style={styles.previewBtnText}>Retake</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm} disabled={uploadPhoto.isPending} testID="selfie-confirm">
            {uploadPhoto.isPending ? <ActivityIndicator color={Colors.white} /> : <Check size={20} color={Colors.white} />}
            <Text style={styles.previewBtnText}>{uploadPhoto.isPending ? 'Uploading…' : 'Use Photo'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

      {/* Darkened mask with a circular cutout guiding face placement */}
      <View pointerEvents="none" style={[styles.maskStrip, { top: 0, height: GUIDE_TOP }]} />
      <View pointerEvents="none" style={[styles.maskStrip, { top: GUIDE_TOP + GUIDE_SIZE, bottom: 0 }]} />
      <View pointerEvents="none" style={[styles.maskSide, { top: GUIDE_TOP, height: GUIDE_SIZE, left: 0, width: (SCREEN_WIDTH - GUIDE_SIZE) / 2 }]} />
      <View pointerEvents="none" style={[styles.maskSide, { top: GUIDE_TOP, height: GUIDE_SIZE, right: 0, width: (SCREEN_WIDTH - GUIDE_SIZE) / 2 }]} />
      <View
        pointerEvents="none"
        style={[styles.guideCircle, { top: GUIDE_TOP, left: (SCREEN_WIDTH - GUIDE_SIZE) / 2, width: GUIDE_SIZE, height: GUIDE_SIZE, borderRadius: GUIDE_SIZE / 2 }]}
      />

      <Pressable style={[styles.closeBtn, { top: insets.top + 10 }]} onPress={() => router.back()} testID="selfie-close">
        <X size={22} color={Colors.white} />
      </Pressable>

      <Text style={[styles.hint, { top: GUIDE_TOP - 40 }]}>Center your face in the circle</Text>

      <View style={[styles.captureRow, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.captureBtn} onPress={() => void handleCapture()} disabled={isCapturing} testID="selfie-capture">
          {isCapturing ? <ActivityIndicator color={Colors.white} /> : <View style={styles.captureBtnInner} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  centered: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
    gap: 10,
  },
  permissionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 8,
  },
  permissionText: {
    color: Colors.gray[400],
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 8,
  },
  permissionBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  cancelLink: {
    marginTop: 8,
    padding: 8,
  },
  cancelLinkText: {
    color: Colors.gray[400],
    fontSize: 14,
  },
  maskStrip: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskSide: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  guideCircle: {
    position: 'absolute' as const,
    borderWidth: 3,
    borderColor: Colors.orange.primary,
  },
  closeBtn: {
    position: 'absolute' as const,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  hint: {
    position: 'absolute' as const,
    alignSelf: 'center' as const,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  captureRow: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
  },
  previewActions: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 16,
    paddingHorizontal: 24,
  },
  uploadProgressWrap: {
    position: 'absolute' as const,
    left: 24,
    right: 24,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  previewBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
