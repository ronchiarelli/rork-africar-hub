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
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Car, Building2, Store } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';

type AccountType = 'customer' | 'fleet_owner' | 'dealership';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', icon: <User size={18} color={Colors.white} /> },
  { value: 'fleet_owner', label: 'Fleet Manager', icon: <Building2 size={18} color={Colors.white} /> },
  { value: 'dealership', label: 'Car Dealer / Garage', icon: <Store size={18} color={Colors.white} /> },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('customer');

  const handleRegister = useCallback(async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const { needsEmailConfirmation } = await register(
        name,
        email,
        phone,
        password,
        accountType !== 'customer' ? accountType : undefined
      );
      if (needsEmailConfirmation) {
        Alert.alert(
          'Check Your Email',
          accountType !== 'customer'
            ? `We sent a confirmation link to your email. Confirm it, then sign in — your ${accountType === 'fleet_owner' ? 'Fleet Manager' : 'Car Dealer / Garage'} application will be submitted automatically and reviewed by an admin.`
            : 'We sent a confirmation link to your email. Confirm it, then sign in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      await login(email, password);
      router.dismissAll();
      if (accountType !== 'customer') {
        Alert.alert(
          'Account Created',
          `Your account is ready. Your ${accountType === 'fleet_owner' ? 'Fleet Manager' : 'Car Dealer / Garage'} application has been submitted for admin review — you'll be upgraded once approved. Next, let's verify your identity.`
        );
      }
      router.replace('/kyc-verification');
    } catch (e) {
      Alert.alert('Registration Failed', getErrorMessage(e, 'Please try again.'));
    }
  }, [name, email, phone, password, accountType, register, login, router]);

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
            <Text style={styles.logoText}>GoCar Hub</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join GoCar Hub and start your journey</Text>

          <View style={styles.form}>
            <Text style={styles.sectionLabel}>I am a...</Text>
            <View style={styles.accountTypeRow}>
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[styles.accountTypeChip, accountType === t.value && styles.accountTypeChipActive]}
                  onPress={() => setAccountType(t.value)}
                  testID={`register-account-type-${t.value}`}
                >
                  {t.icon}
                  <Text style={styles.accountTypeText}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            {accountType !== 'customer' && (
              <Text style={styles.accountTypeHint}>
                Your account starts as a customer while an admin reviews your {accountType === 'fleet_owner' ? 'Fleet Manager' : 'Car Dealer / Garage'} application.
              </Text>
            )}

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
              onPress={() => void handleRegister()}
              testID="register-submit"
            >
              <Text style={styles.registerBtnText}>Create Account</Text>
            </Pressable>

            <Text style={styles.legalText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
            </Text>

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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gray[400],
    marginBottom: 10,
  },
  accountTypeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 8,
  },
  accountTypeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  accountTypeChipActive: {
    backgroundColor: Colors.orange.primary,
    borderColor: Colors.orange.primary,
  },
  accountTypeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  accountTypeHint: {
    color: Colors.gray[400],
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 17,
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
  legalText: {
    color: Colors.gray[400],
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center' as const,
    marginTop: 16,
  },
  legalLink: {
    color: Colors.orange.primary,
    fontWeight: '600' as const,
  },
});
