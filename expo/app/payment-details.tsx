import React, { useCallback, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, Smartphone, Landmark } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdatePaymentDetails } from '@/lib/queries/profile';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import type { UserProfile } from '@/types/car';

const MOMO_PROVIDERS: { value: 'mtn' | 'vodafone' | 'airteltigo'; label: string }[] = [
  { value: 'mtn', label: 'MTN' },
  { value: 'vodafone', label: 'Vodafone' },
  { value: 'airteltigo', label: 'AirtelTigo' },
];

export default function PaymentDetailsScreen() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  return <PaymentDetailsForm key={currentUser.id} currentUser={currentUser} />;
}

function PaymentDetailsForm({ currentUser }: { currentUser: UserProfile }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updatePaymentDetails = useUpdatePaymentDetails(currentUser.id);

  const [momoProvider, setMomoProvider] = useState<'mtn' | 'vodafone' | 'airteltigo' | null>(currentUser.momoProvider);
  const [momoNumber, setMomoNumber] = useState<string>(currentUser.momoNumber);
  const [bankName, setBankName] = useState<string>(currentUser.bankName);
  const [bankAccountName, setBankAccountName] = useState<string>(currentUser.bankAccountName);
  const [bankAccountNumber, setBankAccountNumber] = useState<string>(currentUser.bankAccountNumber);

  const handleSave = useCallback(() => {
    updatePaymentDetails.mutate(
      {
        momoProvider: momoNumber.trim() ? momoProvider : null,
        momoNumber: momoNumber.trim(),
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
      },
      {
        onSuccess: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile');
          }
        },
        onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not save your payment details. Please try again.')),
      }
    );
  }, [momoProvider, momoNumber, bankName, bankAccountName, bankAccountNumber, updatePaymentDetails, router]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <View style={styles.infoCard}>
          <AlertCircle size={18} color={Colors.orange.primary} />
          <Text style={styles.infoText}>
            These details are shown to a customer once their booking is approved, so they know how to pay you directly. This has no connection to in-app Hubtel payment.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Smartphone size={18} color={Colors.purple.medium} />
          <Text style={styles.sectionTitle}>Mobile Money</Text>
        </View>
        <View style={styles.providerRow}>
          {MOMO_PROVIDERS.map((p) => (
            <Pressable
              key={p.value}
              style={[styles.providerBtn, momoProvider === p.value && styles.providerBtnActive]}
              onPress={() => setMomoProvider(p.value)}
              testID={`momo-provider-${p.value}`}
            >
              <Text style={[styles.providerBtnText, momoProvider === p.value && styles.providerBtnTextActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Mobile Money Number</Text>
          <TextInput
            style={styles.input}
            value={momoNumber}
            onChangeText={setMomoNumber}
            placeholder="e.g. 024 123 4567"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="phone-pad"
            testID="momo-number-input"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Landmark size={18} color={Colors.purple.medium} />
          <Text style={styles.sectionTitle}>Bank Account</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. GCB Bank"
            placeholderTextColor={Colors.gray[400]}
            testID="bank-name-input"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={bankAccountName}
            onChangeText={setBankAccountName}
            placeholder="Name on the account"
            placeholderTextColor={Colors.gray[400]}
            testID="bank-account-name-input"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            placeholder="Account number"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="numeric"
            testID="bank-account-number-input"
          />
        </View>

        <Pressable
          style={[styles.saveBtn, updatePaymentDetails.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={updatePaymentDetails.isPending}
          testID="save-payment-details-btn"
        >
          {updatePaymentDetails.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Payment Details</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray[50], alignItems: 'center' as const, justifyContent: 'center' as const },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.orange.faint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  providerRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 18,
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  providerBtnActive: {
    backgroundColor: Colors.purple.deep,
    borderColor: Colors.purple.deep,
  },
  providerBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  providerBtnTextActive: {
    color: Colors.white,
  },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.gray[700], marginBottom: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.gray[900],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  saveBtn: {
    backgroundColor: Colors.orange.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
});
