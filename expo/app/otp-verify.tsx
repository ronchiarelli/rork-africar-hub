import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

const OTP_LENGTH = 4;

export default function OTPVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      void (async () => {
        await login();
        router.dismissAll();
        router.replace('/(tabs)/(home)');
      })();
    }
  }, [otp, login, router]);

  const handleResend = useCallback(() => {
    if (countdown > 0) return;
    setCountdown(30);
    Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
  }, [countdown]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.white} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Phone size={32} color={Colors.orange.primary} />
        </View>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phone ?? '+233xxxxxxxxx'}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit !== '' && styles.otpInputFilled]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, index)}
              keyboardType="number-pad"
              maxLength={1}
              testID={`otp-${index}`}
            />
          ))}
        </View>

        <Pressable onPress={handleResend} disabled={countdown > 0}>
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.purple.deep,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
    marginTop: -60,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 44, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[400],
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 22,
  },
  phoneText: {
    color: Colors.orange.primary,
    fontWeight: '700' as const,
  },
  otpRow: {
    flexDirection: 'row' as const,
    gap: 14,
    marginTop: 32,
    marginBottom: 24,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  otpInputFilled: {
    borderColor: Colors.orange.primary,
    backgroundColor: 'rgba(255,107,44,0.1)',
  },
  resendText: {
    color: Colors.orange.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resendDisabled: {
    color: Colors.gray[500],
  },
});
