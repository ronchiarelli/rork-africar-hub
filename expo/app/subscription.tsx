import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle2, Clock3, AlertCircle, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription, useInitiateSubscriptionPayment } from '@/lib/queries/subscriptions';
import { useSubscriptionRate } from '@/lib/queries/admin';
import { getNavBarClearance } from '@/components/BottomNavBar';
import { getErrorMessage } from '@/lib/errors';

const PLAN_FEATURES = [
  'List unlimited cars for rent or sale',
  'Appear in customer search & marketplace',
  'Fleet / dealer dashboard access',
  'Booking requests from real customers',
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentRole } = useAuth();
  const { data: sub, isLoading } = useSubscription();
  const { data: platformRate } = useSubscriptionRate();
  const displayRate = sub?.row?.amount ?? platformRate ?? 250;
  const initiatePayment = useInitiateSubscriptionPayment();

  const handleSubscribe = useCallback(() => {
    initiatePayment.mutate(undefined, {
      onSuccess: async (data) => {
        if (Platform.OS === 'web') {
          window.open(data.checkoutUrl, '_blank');
        } else {
          await WebBrowser.openBrowserAsync(data.checkoutUrl);
        }
      },
      onError: (err) => {
        Alert.alert('Could not start payment', getErrorMessage(err, 'Something went wrong. Please try again.'));
      },
    });
  }, [initiatePayment]);

  const roleLabel = currentRole === 'dealership' ? 'Dealership' : 'Fleet Owner';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>{roleLabel} Plan</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>GH₵</Text>
            <Text style={styles.price}>{displayRate}</Text>
            <Text style={styles.perMonth}>/month</Text>
          </View>

          {isLoading ? null : sub?.isActive ? (
            <View style={[styles.statusBadge, sub.isTrialing ? styles.statusBadgeTrial : styles.statusBadgeActive]}>
              {sub.isTrialing ? <Clock3 size={14} color={Colors.warning} /> : <CheckCircle2 size={14} color={Colors.success} />}
              <Text style={[styles.statusText, { color: sub.isTrialing ? Colors.warning : Colors.success }]}>
                {sub.isTrialing ? `Free trial — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} left` : `Active — renews in ${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'}`}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusBadgeExpired]}>
              <AlertCircle size={14} color={Colors.error} />
              <Text style={[styles.statusText, { color: Colors.error }]}>No active subscription</Text>
            </View>
          )}
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What you get</Text>
          {PLAN_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Zap size={14} color={Colors.orange.primary} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Subscriptions are billed monthly via Mobile Money or card through Hubtel. This covers your platform access only — payment for rentals/sales is arranged directly between you and your customers.
        </Text>

        <Pressable
          style={[styles.subscribeBtn, initiatePayment.isPending && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={initiatePayment.isPending}
          testID="subscribe-btn"
        >
          <Text style={styles.subscribeBtnText}>
            {initiatePayment.isPending ? 'Starting…' : sub?.isActive && !sub.isTrialing ? 'Renew Now' : 'Subscribe Now'}
          </Text>
        </Pressable>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  headerCard: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center' as const,
  },
  headerLabel: { color: Colors.gray[400], fontSize: 14, fontWeight: '500' as const },
  priceRow: { flexDirection: 'row' as const, alignItems: 'baseline' as const, marginTop: 8 },
  currency: { color: Colors.orange.primary, fontSize: 18, fontWeight: '700' as const },
  price: { color: Colors.white, fontSize: 42, fontWeight: '800' as const, marginLeft: 4 },
  perMonth: { color: Colors.gray[400], fontSize: 14, marginLeft: 4 },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeTrial: { backgroundColor: Colors.warning + '20' },
  statusBadgeActive: { backgroundColor: Colors.success + '20' },
  statusBadgeExpired: { backgroundColor: Colors.error + '20' },
  statusText: { fontSize: 13, fontWeight: '700' as const },
  featuresCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.gray[900], marginBottom: 12 },
  featureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, color: Colors.gray[700], flex: 1 },
  disclaimer: { fontSize: 12, color: Colors.gray[500], marginTop: 16, lineHeight: 18, textAlign: 'center' as const },
  subscribeBtn: {
    backgroundColor: Colors.orange.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
  backBtn: { alignItems: 'center' as const, marginTop: 16, paddingVertical: 8 },
  backBtnText: { color: Colors.gray[500], fontSize: 14, fontWeight: '600' as const },
});
