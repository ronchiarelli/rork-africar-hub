import React, { useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Password Updated', 'Your password has been changed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Could Not Update Password', getErrorMessage(e, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, router]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <Text style={styles.subtitle}>Choose a new password for your account.</Text>

        <View style={styles.inputWrap}>
          <Lock size={18} color={Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={Colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            testID="change-password-new"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} color={Colors.gray[400]} /> : <Eye size={18} color={Colors.gray[400]} />}
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <Lock size={18} color={Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={Colors.gray[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            testID="change-password-confirm"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          testID="change-password-submit"
        >
          {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Update Password</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 20,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray[900],
  },
  submitBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
