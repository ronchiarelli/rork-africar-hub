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
import { ArrowLeft, Phone, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import { normalizePhone, pinWeakness } from '@/lib/phone';
import { useAuth } from '@/providers/AuthProvider';
import AppLogo from '@/components/AppLogo';

async function functionError(error: unknown, fallback: string): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return body.error as string;
    } catch {
      // non-JSON body
    }
  }
  return (error as { message?: string })?.message ?? fallback;
}

// Migration screen for accounts made before phone login existed. Attaching
// a PIN replaces the account password, so this is explicit about that
// rather than letting someone discover their old password stopped working.
export default function SetPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [phone, setPhone] = useState(currentUser?.phone?.replace(/^\+/, '') ?? '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const canonical = normalizePhone(phone);
    if (!canonical) {
      Alert.alert('Check Your Number', 'Enter a valid Ghana phone number, e.g. 024 123 4567.');
      return;
    }
    const weak = pinWeakness(pin);
    if (weak) {
      Alert.alert('Choose a Different PIN', weak);
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PINs Do Not Match', 'Please re-enter the same 6-digit PIN.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ linked?: boolean; error?: string }>(
        'phone-pin-auth',
        { body: { action: 'set-pin', phone: canonical, pin } }
      );
      if (error) throw new Error(await functionError(error, 'Could not set your PIN.'));
      if (data?.error) throw new Error(data.error);
      Alert.alert(
        'PIN Set',
        'You can now sign in with your phone number and PIN. Your previous password no longer works.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Could Not Set PIN', getErrorMessage(e, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, pin, confirmPin, router]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} testID="set-pin-back">
            <ArrowLeft size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <AppLogo size={40} />
          </View>
          <Text style={styles.title}>Switch to Phone + PIN</Text>
          <Text style={styles.subtitle}>
            Sign in faster with your phone number and a 6-digit PIN. This replaces your current
            password — after setting it, use the PIN to sign in.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Phone size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.gray[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                testID="set-pin-phone"
              />
            </View>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Create a 6-digit PIN"
                placeholderTextColor={Colors.gray[400]}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                testID="set-pin-pin"
              />
            </View>
            <View style={styles.inputWrap}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your PIN"
                placeholderTextColor={Colors.gray[400]}
                value={confirmPin}
                onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                testID="set-pin-confirm"
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
              testID="set-pin-submit"
            >
              {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Set PIN</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.purple.deep },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' as const },
  logoWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.gray[400], marginTop: 10, lineHeight: 21 },
  form: { marginTop: 28 },
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
  input: { flex: 1, fontSize: 15, color: Colors.white },
  submitBtn: {
    backgroundColor: Colors.orange.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  submitBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  submitBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' as const },
});
