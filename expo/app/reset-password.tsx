import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, Car } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled) {
        setHasValidSession(true);
        setIsReady(true);
      }
    });

    // Fallback: detectSessionInUrl may have already established the
    // recovery session by the time this effect runs, before the
    // PASSWORD_RECOVERY event listener above was attached.
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        setHasValidSession(true);
      }
      if (!cancelled) setIsReady(true);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

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
      await supabase.auth.signOut();
      Alert.alert('Password Updated', 'Your password has been reset. Please sign in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e) {
      Alert.alert('Could Not Update Password', getErrorMessage(e, 'Please try requesting a new reset link.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, router]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  if (!hasValidSession) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.centered]}>
          <View style={styles.logoWrap}>
            <Car size={28} color={Colors.orange.primary} />
            <Text style={styles.logoText}>GoCar Hub</Text>
          </View>
          <Text style={styles.title}>Link Expired</Text>
          <Text style={styles.subtitle}>This password reset link is invalid or has expired. Please request a new one.</Text>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={() => router.replace('/forgot-password')}
          >
            <Text style={styles.submitBtnText}>Request New Link</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={[styles.logoWrap, { marginTop: insets.top + 20 }]}>
            <Car size={28} color={Colors.orange.primary} />
            <Text style={styles.logoText}>GoCar Hub</Text>
          </View>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Choose a new password for your account.</Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="reset-password-new"
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
                testID="reset-password-confirm"
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
              testID="reset-password-submit"
            >
              {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Update Password</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.purple.deep,
  },
  centered: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center' as const,
  },
  logoWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 10,
    lineHeight: 21,
    textAlign: 'center' as const,
  },
  form: {
    marginTop: 28,
  },
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
