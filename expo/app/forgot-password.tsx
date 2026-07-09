import React, { useState, useCallback } from 'react';
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
import { ArrowLeft, Mail, Car } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';

const PRODUCTION_WEB_URL = 'https://gocar-hub.vercel.app';

function getRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/reset-password`;
  }
  return `${PRODUCTION_WEB_URL}/reset-password`;
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectTo(),
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      Alert.alert('Could Not Send Reset Link', getErrorMessage(e, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Car size={28} color={Colors.orange.primary} />
            <Text style={styles.logoText}>GoCar Hub</Text>
          </View>

          {sent ? (
            <>
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to {email}. Follow the link to set a new password, then come back and sign in.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
                onPress={() => router.replace('/login')}
                testID="forgot-password-back-to-login"
              >
                <Text style={styles.submitBtnText}>Back to Sign In</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a link to reset your password.</Text>

              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <Mail size={18} color={Colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={Colors.gray[400]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="forgot-password-email"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
                  onPress={() => void handleSubmit()}
                  disabled={isSubmitting}
                  testID="forgot-password-submit"
                >
                  {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Send Reset Link</Text>}
                </Pressable>
              </View>
            </>
          )}
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
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 10,
    lineHeight: 21,
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
    marginBottom: 20,
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
