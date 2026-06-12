import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditCard, Smartphone, Wallet, CheckCircle2, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockPaymentMethods } from '@/mocks/cars';

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  momo_mtn: <Smartphone size={20} color="#FFCC00" />,
  momo_vodafone: <Smartphone size={20} color="#E60000" />,
  momo_airteltigo: <Smartphone size={20} color="#0066CC" />,
  card: <CreditCard size={20} color={Colors.info} />,
  wallet: <Wallet size={20} color={Colors.orange.primary} />,
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { total, days, pickup, returnD, location } = useLocalSearchParams<{
    carId: string;
    total: string;
    days: string;
    pickup: string;
    returnD: string;
    location: string;
  }>();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string>('pm1');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handlePay = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
    }, 2000);
  }, []);

  const handleDone = useCallback(() => {
    router.dismissAll();
    router.replace('/(tabs)/bookings');
  }, [router]);

  if (completed) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <CheckCircle2 size={60} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>Your booking has been confirmed. Check your bookings for details.</Text>

        <View style={styles.successDetails}>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Amount Paid</Text>
            <Text style={styles.successValue}>GH₵{Number(total).toLocaleString()}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Duration</Text>
            <Text style={styles.successValue}>{days} days</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Pickup Date</Text>
            <Text style={styles.successValue}>{pickup}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Location</Text>
            <Text style={styles.successValue}>{location}</Text>
          </View>
        </View>

        <Pressable style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>View My Bookings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{days} day{Number(days) > 1 ? 's' : ''} rental</Text>
            <Text style={styles.summaryValue}>GH₵{Number(total).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup</Text>
            <Text style={styles.summaryValue}>{pickup}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Return</Text>
            <Text style={styles.summaryValue}>{returnD}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue}>{location}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {mockPaymentMethods.map((method) => (
          <Pressable
            key={method.id}
            style={[styles.methodCard, selectedMethod === method.id && styles.methodCardActive]}
            onPress={() => setSelectedMethod(method.id)}
            testID={`payment-${method.id}`}
          >
            <View style={styles.methodLeft}>
              {PAYMENT_ICONS[method.type] ?? <CreditCard size={20} color={Colors.gray[500]} />}
              <View>
                <Text style={styles.methodLabel}>{method.label}</Text>
                {method.details && <Text style={styles.methodDetails}>{method.details}</Text>}
              </View>
            </View>
            <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
              {selectedMethod === method.id && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}

        <View style={styles.secureNote}>
          <Shield size={16} color={Colors.success} />
          <Text style={styles.secureText}>Your payment is secured with 256-bit encryption</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>GH₵{Number(total).toLocaleString()}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.payBtn, pressed && styles.payBtnPressed, processing && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={processing}
          testID="pay-btn"
        >
          {processing ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.payBtnText}>Pay Now</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  methodCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  methodCardActive: {
    borderColor: Colors.orange.primary,
    backgroundColor: Colors.orange.faint,
  },
  methodLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  methodDetails: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  radioActive: {
    borderColor: Colors.orange.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.orange.primary,
  },
  secureNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 20,
  },
  secureText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  payBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 140,
    alignItems: 'center' as const,
  },
  payBtnPressed: {
    backgroundColor: Colors.orange.bright,
    transform: [{ scale: 0.97 }],
  },
  payBtnDisabled: {
    opacity: 0.8,
  },
  payBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 30,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  successSub: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },
  successRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
  },
  successLabel: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  successValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  doneBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
    width: '100%',
    alignItems: 'center' as const,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
