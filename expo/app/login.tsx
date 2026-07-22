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
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AppLogo from '@/components/AppLogo';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.dismissAll();
      router.replace('/(tabs)/(home)');
    } catch (e) {
      Alert.alert('Sign In Failed', getErrorMessage(e, 'Please check your credentials and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, router]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/(home)');
              }
            }}
            testID="login-back-btn"
          >
            <ArrowLeft size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <AppLogo size={40} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

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
                testID="login-email"
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="login-password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color={Colors.gray[400]} /> : <Eye size={18} color={Colors.gray[400]} />}
              </Pressable>
            </View>

            <Pressable style={styles.forgotBtn} onPress={() => router.push('/forgot-password')} testID="login-forgot-password">
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.loginBtn, (pressed || isSubmitting) && styles.loginBtnPressed]}
              onPress={() => void handleLogin()}
              disabled={isSubmitting}
              testID="login-submit"
            >
              {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginBtnText}>Sign In</Text>}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.guestBtn}
              onPress={() => router.replace('/(tabs)/(home)')}
              testID="login-continue-as-guest"
            >
              <Text style={styles.guestBtnText}>Continue browsing as guest</Text>
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
  title: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 6,
  },
  form: {
    marginTop: 32,
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
  forgotBtn: {
    alignSelf: 'flex-end' as const,
    marginBottom: 20,
  },
  forgotText: {
    color: Colors.orange.primary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  loginBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  loginBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  signupRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 20,
  },
  signupText: {
    color: Colors.gray[400],
    fontSize: 14,
  },
  signupLink: {
    color: Colors.orange.primary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  guestBtn: {
    alignItems: 'center' as const,
    marginTop: 18,
    paddingVertical: 10,
  },
  guestBtnText: {
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
});
