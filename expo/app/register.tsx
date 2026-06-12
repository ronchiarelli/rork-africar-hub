import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Car } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = useCallback(() => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    router.push({ pathname: '/otp-verify', params: { phone } });
  }, [name, email, phone, password, router]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.white} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Car size={28} color={Colors.orange.primary} />
            <Text style={styles.logoText}>AutoRide</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join AutoRide and start your journey</Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <User size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.gray[400]}
                value={name}
                onChangeText={setName}
                testID="register-name"
              />
            </View>

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
                testID="register-email"
              />
            </View>

            <View style={styles.inputWrap}>
              <Phone size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Phone (e.g. +233241234567)"
                placeholderTextColor={Colors.gray[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                testID="register-phone"
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
                testID="register-password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color={Colors.gray[400]} /> : <Eye size={18} color={Colors.gray[400]} />}
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
              onPress={handleRegister}
              testID="register-submit"
            >
              <Text style={styles.registerBtnText}>Create Account</Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
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
  registerBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  registerBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  registerBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  loginRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 20,
  },
  loginText: {
    color: Colors.gray[400],
    fontSize: 14,
  },
  loginLink: {
    color: Colors.orange.primary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
