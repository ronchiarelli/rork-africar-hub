import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdateProfile } from '@/lib/queries/profile';
import { getErrorMessage } from '@/lib/errors';
import { extensionFromBlob } from '@/lib/imageUpload';
import { getNavBarClearance } from '@/components/BottomNavBar';
import Avatar from '@/components/Avatar';
import type { UserProfile } from '@/types/car';

export default function EditProfileScreen() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  // Keyed on the user id so the form's local state (initialized below from
  // currentUser) always mounts fresh with real data, instead of a stale
  // empty-string initializer captured before the profile fetch resolved.
  return <EditProfileForm key={currentUser.id} currentUser={currentUser} />;
}

function EditProfileForm({ currentUser }: { currentUser: UserProfile }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile(currentUser.id);

  const [name, setName] = useState<string>(currentUser.name ?? '');
  const [phone, setPhone] = useState<string>(currentUser.phone ?? '');
  const [whatsapp, setWhatsapp] = useState<string>(currentUser.whatsapp ?? '');
  const [avatar, setAvatar] = useState<string>(currentUser.avatar ?? '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  const handlePickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = extensionFromBlob(blob, uri);
      const path = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('car-images').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(path);
      setAvatar(publicUrlData.publicUrl);
    } catch (err) {
      Alert.alert('Upload failed', getErrorMessage(err, 'Could not upload your photo. Please try again.'));
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [currentUser.id]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile.mutate(
      { name: name.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(), avatar },
      {
        onSuccess: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile');
          }
        },
        onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not save your changes. Please try again.')),
      }
    );
  }, [name, phone, whatsapp, avatar, updateProfile, router]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarWrap} onPress={handlePickAvatar} disabled={isUploadingAvatar} testID="edit-avatar-btn">
            <Avatar uri={avatar} name={name} size={96} style={styles.avatar} />
            <View style={styles.avatarOverlay}>
              {isUploadingAvatar ? <ActivityIndicator color={Colors.white} size="small" /> : <Camera size={20} color={Colors.white} />}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.gray[400]}
            testID="edit-name-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="phone-pad"
            testID="edit-phone-input"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>WhatsApp Number</Text>
            {!!phone && phone !== whatsapp && (
              <Pressable onPress={() => setWhatsapp(phone)} testID="whatsapp-same-as-phone">
                <Text style={styles.sameAsPhoneLink}>Same as phone</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.inputWithIcon}>
            <MessageCircle size={16} color={Colors.success} />
            <TextInput
              style={styles.inputWithIconField}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Your WhatsApp number"
              placeholderTextColor={Colors.gray[400]}
              keyboardType="phone-pad"
              testID="edit-whatsapp-input"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.disabledText}>{currentUser.email}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.saveBtn, (updateProfile.isPending || isUploadingAvatar) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={updateProfile.isPending || isUploadingAvatar}
          testID="save-profile-btn"
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray[50], alignItems: 'center' as const, justifyContent: 'center' as const },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center' as const, marginBottom: 24 },
  avatarWrap: { position: 'relative' as const },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Colors.orange.primary,
    backgroundColor: Colors.gray[200],
  },
  avatarOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.purple.deep,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.gray[50],
  },
  avatarHint: { marginTop: 10, fontSize: 13, color: Colors.gray[500] },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.gray[700], marginBottom: 8 },
  fieldLabelRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  sameAsPhoneLink: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputWithIconField: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray[900],
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.gray[900],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputDisabled: { backgroundColor: Colors.gray[100] },
  disabledText: { fontSize: 15, color: Colors.gray[500] },
  saveBtn: {
    backgroundColor: Colors.orange.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
});
