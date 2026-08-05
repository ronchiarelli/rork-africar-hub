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
import { ArrowLeft, Phone, Lock, MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import { normalizePhone, pinWeakness } from '@/lib/phone';
import AppLogo from '@/components/AppLogo';

// Reads the JSON error body that functions.invoke() buries on .context —
// the useful messages ("Please wait 43s…") live there, not on .message.
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

export default function ForgotPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = useCallback(async () => {
    const canonical = normalizePhone(phone);
    if (!canonical) {
      Alert.alert('Check Your Number', 'Enter a valid Ghana phone number, e.g. 024 123 4567.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ sent?: boolean; error?: string }>(
        'phone-pin-reset',
        { body: { action: 'request', phone: canonical } }
      );
      if (error) throw new Error(await functionError(error, 'Could not send the code.'));
      if (data?.error) throw new Error(data.error);
      // Always advance, even for an unregistered number — the server
      // deliberately can't tell us which it was, so neither can this screen.
      setStep('confirm');
    } catch (e) {
      Alert.alert('Could Not Send Code', getErrorMessage(e, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [phone]);

  const handleConfirm = useCallback(async () => {
    const canonical = normalizePhone(phone);
    if (!canonical) return;
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Check the Code', 'Enter the 6-digit code from the SMS.');
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
      const { data, error } = await supabase.functions.invoke<{ reset?: boolean; error?: string }>(
        'phone-pin-reset',
        { body: { action: 'confirm', phone: canonical, code, pin } }
      );
      if (error) throw new Error(await functionError(error, 'Could not reset your PIN.'));
      if (data?.error) throw new Error(data.error);
      Alert.alert('PIN Updated', 'You can now sign in with your new PIN.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
    } catch (e) {
      Alert.alert('Could Not Reset PIN', getErrorMessage(e, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, code, pin, confirmPin, router]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} testID="forgot-pin-back">
            <ArrowLeft size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <AppLogo size={40} />
          </View>

          {step === 'request' ? (
            <>
              <Text style={styles.title}>Forgot Your PIN?</Text>
              <Text style={styles.subtitle}>
                Enter your phone number and we&apos;ll text you a 6-digit code to reset it.
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
                    testID="forgot-pin-phone"
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
                  onPress={() => void handleRequest()}
                  disabled={isSubmitting}
                  testID="forgot-pin-request"
                >
                  {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Send Code</Text>}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter the Code</Text>
              <Text style={styles.subtitle}>
                If that number has an account, we&apos;ve sent it a 6-digit code. It expires in 10 minutes.
              </Text>
              <View style={styles.form}>
                <View style={styles.inputWrap}>
                  <MessageSquare size={18} color={Colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor={Colors.gray[400]}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    testID="forgot-pin-code"
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Lock size={18} color={Colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="New 6-digit PIN"
                    placeholderTextColor={Colors.gray[400]}
                    value={pin}
                    onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    testID="forgot-pin-new"
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Lock size={18} color={Colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new PIN"
                    placeholderTextColor={Colors.gray[400]}
                    value={confirmPin}
                    onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    testID="forgot-pin-confirm"
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [styles.submitBtn, (pressed || isSubmitting) && styles.submitBtnPressed]}
                  onPress={() => void handleConfirm()}
                  disabled={isSubmitting}
                  testID="forgot-pin-submit"
                >
                  {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Set New PIN</Text>}
                </Pressable>
                <Pressable style={styles.resendBtn} onPress={() => setStep('request')} testID="forgot-pin-back-to-phone">
                  <Text style={styles.resendText}>Use a different number</Text>
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
  resendBtn: { alignItems: 'center' as const, marginTop: 18 },
  resendText: { color: Colors.orange.primary, fontSize: 14, fontWeight: '700' as const },
});
