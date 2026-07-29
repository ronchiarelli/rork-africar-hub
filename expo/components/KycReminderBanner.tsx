import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { isKycCleared } from '@/lib/kyc';

// Persistent (non-dismissible) prompt for signed-in users who can't yet
// transact. Deliberately not a TipBanner — that one is dismissible and
// remembers the dismissal, which is wrong for a blocker the user has to
// clear before booking or going live.
export default function KycReminderBanner() {
  const router = useRouter();
  const { currentUser } = useAuth();

  if (!currentUser || isKycCleared(currentUser)) return null;

  const started = currentUser.verificationStatus === 'pending';
  const rejected = currentUser.verificationStatus === 'rejected';

  return (
    <Pressable
      style={styles.banner}
      onPress={() => router.push('/kyc-verification')}
      testID="kyc-reminder-banner"
    >
      <View style={styles.iconWrap}>
        <ShieldAlert size={18} color={Colors.white} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {rejected ? 'Verification needs attention' : started ? 'Verification under review' : 'Verify your identity'}
        </Text>
        <Text style={styles.subtitle}>
          {rejected
            ? 'A document was rejected — re-upload it to continue.'
            : started
              ? 'We’re reviewing your documents. You can book and go live once approved.'
              : 'Add an ID document and a selfie to book cars or take listings live.'}
        </Text>
      </View>
      <ChevronRight size={18} color={Colors.orange.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.orange.faint,
    borderWidth: 1,
    borderColor: Colors.orange.primary + '40',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800' as const, color: Colors.gray[900] },
  subtitle: { fontSize: 11, fontWeight: '500' as const, color: Colors.gray[600], marginTop: 2, lineHeight: 15 },
});
