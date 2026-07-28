import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  CalendarDays,
  MapPin,
  Clock,
  DollarSign,
  Star,
  MessageCircle,
  Phone,
  CheckCircle2,
  XCircle,
  Clock3,
  Car,
  AlertTriangle,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Check,
  X,
  Smartphone,
  Landmark,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useBookingDetail, useOwnerAcceptsInAppPayment, useInitiateBookingPayment, useReviewBooking } from '@/lib/queries/bookings';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { useBookingIssueReports } from '@/lib/queries/issueReports';
import { useOwnerPaymentDetails } from '@/lib/queries/profile';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import AnimatedApproveButton from '@/components/AnimatedApproveButton';

// Marker URL for openAuthSessionAsync to watch for — see payment-bridge.tsx.
const PAYMENT_RETURN_SCHEME_URL = 'gocarhub://payment-return';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  pending: { icon: <Clock3 size={18} color={Colors.warning} />, color: Colors.warning, label: 'Pending Approval', bg: Colors.warning + '15' },
  approved: { icon: <CheckCircle2 size={18} color={Colors.info} />, color: Colors.info, label: 'Approved', bg: Colors.info + '15' },
  active: { icon: <Car size={18} color={Colors.success} />, color: Colors.success, label: 'Active Rental', bg: Colors.success + '15' },
  completed: { icon: <CheckCircle2 size={18} color={Colors.success} />, color: Colors.success, label: 'Completed', bg: Colors.success + '15' },
  cancelled: { icon: <XCircle size={18} color={Colors.error} />, color: Colors.error, label: 'Cancelled', bg: Colors.error + '15' },
};

const ISSUE_STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  open: { color: Colors.warning, label: 'Open', bg: Colors.warning + '15' },
  in_review: { color: Colors.info, label: 'In Review', bg: Colors.info + '15' },
  resolved: { color: Colors.success, label: 'Resolved', bg: Colors.success + '15' },
};

const MOMO_PROVIDER_LABELS: Record<string, string> = {
  mtn: 'MTN',
  vodafone: 'Vodafone',
  airteltigo: 'AirtelTigo',
};

const KYC_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: Colors.gray[200], text: Colors.gray[600], label: 'KYC Not Started' },
  pending: { bg: Colors.warning + '20', text: Colors.warning, label: 'KYC Pending Review' },
  restricted: { bg: Colors.info + '20', text: Colors.info, label: 'ID Verified (Restricted)' },
  approved: { bg: Colors.success + '20', text: Colors.success, label: 'KYC Verified' },
  rejected: { bg: Colors.error + '20', text: Colors.error, label: 'KYC Rejected' },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: booking, isLoading } = useBookingDetail(id);
  const { data: issueReports = [] } = useBookingIssueReports(id);
  const { data: ownerAcceptsInAppPayment = false } = useOwnerAcceptsInAppPayment(booking?.car.ownerId ?? undefined);
  const { data: ownerPaymentDetails } = useOwnerPaymentDetails(booking?.car.ownerId ?? undefined);
  const initiatePayment = useInitiateBookingPayment();
  const getOrCreateConversation = useGetOrCreateConversation();
  const reviewBooking = useReviewBooking();

  const config = booking ? STATUS_CONFIG[booking.status] : null;
  const isOwner = !!booking && !!currentUser && booking.car.ownerId === currentUser.id;
  const canReviewBooking = isOwner && booking?.status === 'pending';
  const kycConfig = booking ? KYC_STATUS_CONFIG[booking.customerVerificationStatus] ?? KYC_STATUS_CONFIG.none : KYC_STATUS_CONFIG.none;

  const handleReview = (decision: 'approved' | 'cancelled') => {
    if (!booking) return;
    if (decision === 'approved' && booking.customerVerificationStatus !== 'approved' && booking.customerVerificationStatus !== 'restricted') {
      Alert.alert(
        'KYC Not Verified',
        `${booking.customerName} hasn't completed KYC verification yet. You can approve this booking once an admin has verified their ID documents.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'View ID Documents', onPress: () => router.push({ pathname: '/renter-kyc', params: { userId: booking.customerId, name: booking.customerName } }) },
        ]
      );
      return;
    }
    reviewBooking.mutate(
      { bookingId: booking.id, decision },
      {
        onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this booking.')),
      }
    );
  };

  const handleMessage = () => {
    if (!booking || !booking.car.ownerId) return;
    getOrCreateConversation.mutate(
      { otherUserId: booking.car.ownerId, contextType: 'booking', contextId: booking.id, contextLabel: `${booking.car.brand} ${booking.car.model}` },
      {
        onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
        onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
      }
    );
  };

  const handleCall = () => {
    if (!booking) return;
    void Linking.openURL(`tel:${booking.car.ownerPhone}`);
  };

  // openAuthSessionAsync watches for a redirect back to
  // PAYMENT_RETURN_SCHEME_URL and resolves as soon as it happens, so the
  // booking's payment status refreshes automatically instead of staying
  // stuck on "unpaid" until the customer manually reopens the screen. See
  // payment-bridge.tsx for why that has to be our own gocarhub:// scheme
  // rather than the https returnUrl the edge function told Hubtel to use.
  const refreshBooking = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handlePayNow = () => {
    if (!booking) return;
    initiatePayment.mutate(booking.id, {
      onSuccess: async (data) => {
        if (Platform.OS === 'web') {
          window.open(data.checkoutUrl, '_blank');
          return;
        }
        const result = await WebBrowser.openAuthSessionAsync(data.checkoutUrl, PAYMENT_RETURN_SCHEME_URL, {
          preferEphemeralSession: true,
        });
        if (result.type === 'success') {
          const cancelled = result.url.includes('payment=cancelled');
          refreshBooking();
          setTimeout(refreshBooking, 2500);
          if (!cancelled) {
            Alert.alert('Payment received', 'Your payment is being confirmed and will reflect shortly.');
          }
        }
      },
      onError: (err) => {
        Alert.alert('Could not start payment', getErrorMessage(err, 'Something went wrong. Please try again.'));
      },
    });
  };

  const canReview = booking?.status === 'completed';
  const canReportIssue = booking?.status === 'approved' || booking?.status === 'active' || booking?.status === 'completed';
  const canPayNow = booking?.status === 'approved' && ownerAcceptsInAppPayment && booking?.paymentStatus !== 'paid';
  const isPaid = booking?.paymentStatus === 'paid';
  const hasDirectPaymentDetails = !!ownerPaymentDetails && (!!ownerPaymentDetails.momoNumber || !!ownerPaymentDetails.bankAccountNumber);
  const showDirectPaymentDetails = booking?.status === 'approved' && !ownerAcceptsInAppPayment && !isPaid && hasDirectPaymentDetails;

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  if (!booking || !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <Pressable style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
            {config.icon}
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {isPaid && (
            <View style={[styles.statusBanner, { backgroundColor: Colors.success + '15' }]}>
              <CreditCard size={16} color={Colors.success} />
              <Text style={[styles.statusText, { color: Colors.success }]}>Paid</Text>
            </View>
          )}
        </View>

        <View style={styles.carCard}>
          <Image source={{ uri: booking.car.image }} style={styles.carImage} contentFit="cover" />
          <View style={styles.carInfo}>
            <Text style={styles.carBrand}>{booking.car.brand}</Text>
            <Text style={styles.carModel}>{booking.car.model}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color={Colors.star} fill={Colors.star} />
              <Text style={styles.ratingText}>{booking.car.rating} · {booking.car.reviewCount} reviews</Text>
            </View>
          </View>
        </View>

        {canReviewBooking && (
          <>
            <Text style={styles.sectionTitle}>Booking Request</Text>
            <View style={styles.ownerReviewCard}>
              <Text style={styles.ownerReviewCustomer}>{booking.customerName}</Text>
              <Pressable
                style={[styles.kycBadge, { backgroundColor: kycConfig.bg }]}
                onPress={() => router.push({ pathname: '/renter-kyc', params: { userId: booking.customerId, name: booking.customerName } })}
                testID="booking-detail-verify-kyc-btn"
              >
                <ShieldCheck size={13} color={kycConfig.text} />
                <Text style={[styles.kycBadgeText, { color: kycConfig.text }]}>{kycConfig.label}</Text>
              </Pressable>
              <View style={styles.ownerReviewActions}>
                <Pressable
                  style={[styles.reviewActionBtn, styles.declineBtn]}
                  onPress={() => handleReview('cancelled')}
                  disabled={reviewBooking.isPending}
                  testID="booking-detail-decline-btn"
                >
                  <X size={15} color={Colors.error} />
                  <Text style={[styles.reviewActionText, { color: Colors.error }]}>Decline</Text>
                </Pressable>
                <AnimatedApproveButton
                  style={[styles.reviewActionBtn, styles.approveBtn]}
                  onPress={() => handleReview('approved')}
                  disabled={reviewBooking.isPending}
                  testID="booking-detail-approve-btn"
                >
                  <Check size={15} color={Colors.white} />
                  <Text style={[styles.reviewActionText, { color: Colors.white }]}>Approve</Text>
                </AnimatedApproveButton>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Trip Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <CalendarDays size={18} color={Colors.orange.primary} />
            <View>
              <Text style={styles.detailLabel}>Pickup Date</Text>
              <Text style={styles.detailValue}>{booking.pickupDate}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <CalendarDays size={18} color={Colors.purple.medium} />
            <View>
              <Text style={styles.detailLabel}>Return Date</Text>
              <Text style={styles.detailValue}>{booking.returnDate}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MapPin size={18} color={Colors.info} />
            <View>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{booking.pickupLocation}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Clock size={18} color={Colors.gray[600]} />
            <View>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <DollarSign size={18} color={Colors.success} />
            <View>
              <Text style={styles.detailLabel}>Total Price</Text>
              <Text style={styles.detailValue}>GH₵{booking.totalPrice.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <CheckCircle2 size={18} color={Colors.gray[600]} />
            <View>
              <Text style={styles.detailLabel}>Booking Reference</Text>
              <Text style={styles.detailValue}>#{booking.id.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {canPayNow && (
          <>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Pressable
              style={styles.payNowCard}
              onPress={handlePayNow}
              disabled={initiatePayment.isPending}
              testID="pay-now-btn"
            >
              <View style={styles.payNowLeft}>
                <View style={styles.payNowIconWrap}>
                  <CreditCard size={18} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.payNowPrompt}>Pay for this booking</Text>
                  <Text style={styles.payNowAmount}>GH₵{booking.totalPrice.toLocaleString()}</Text>
                </View>
              </View>
              {initiatePayment.isPending ? (
                <ActivityIndicator color={Colors.success} />
              ) : (
                <ChevronRight size={18} color={Colors.gray[400]} />
              )}
            </Pressable>
          </>
        )}

        {showDirectPaymentDetails && ownerPaymentDetails && (
          <>
            <Text style={styles.sectionTitle}>How to Pay</Text>
            <View style={styles.directPaymentCard}>
              <Text style={styles.directPaymentAmount}>GH₵{booking.totalPrice.toLocaleString()}</Text>
              <Text style={styles.directPaymentHint}>Pay the owner directly using one of the details below.</Text>
              {!!ownerPaymentDetails.momoNumber && (
                <View style={styles.directPaymentRow}>
                  <Smartphone size={16} color={Colors.purple.medium} />
                  <View>
                    <Text style={styles.directPaymentLabel}>
                      {ownerPaymentDetails.momoProvider ? MOMO_PROVIDER_LABELS[ownerPaymentDetails.momoProvider] : ''} Mobile Money
                    </Text>
                    <Text style={styles.directPaymentValue}>{ownerPaymentDetails.momoNumber}</Text>
                  </View>
                </View>
              )}
              {!!ownerPaymentDetails.bankAccountNumber && (
                <View style={styles.directPaymentRow}>
                  <Landmark size={16} color={Colors.purple.medium} />
                  <View>
                    <Text style={styles.directPaymentLabel}>{ownerPaymentDetails.bankName || 'Bank Account'}</Text>
                    <Text style={styles.directPaymentValue}>{ownerPaymentDetails.bankAccountNumber}</Text>
                    {!!ownerPaymentDetails.bankAccountName && (
                      <Text style={styles.directPaymentSubValue}>{ownerPaymentDetails.bankAccountName}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Contact Owner</Text>
        <View style={styles.ownerCard}>
          <View style={styles.ownerInfo}>
            <View style={styles.ownerAvatarWrap}>
              <Text style={styles.ownerInitial}>{booking.car.ownerName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.ownerName}>{booking.car.ownerName}</Text>
              <Text style={styles.ownerPhone}>{booking.car.ownerPhone}</Text>
            </View>
          </View>
          <View style={styles.ownerActions}>
            <Pressable style={styles.messageBtn} onPress={handleMessage} testID="booking-detail-message-btn">
              <MessageCircle size={16} color={Colors.white} />
            </Pressable>
            <Pressable style={styles.callBtn} onPress={handleCall}>
              <Phone size={16} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {canReportIssue && (
          <>
            <Text style={styles.sectionTitle}>Report an Issue</Text>
            <Pressable
              style={styles.reportIssueCard}
              onPress={() => router.push({ pathname: '/report-issue', params: { bookingId: booking.id } })}
              testID="report-issue-btn"
            >
              <View style={styles.reportIssueLeft}>
                <View style={styles.reportIssueIconWrap}>
                  <AlertTriangle size={18} color={Colors.warning} />
                </View>
                <Text style={styles.reportIssuePrompt}>Something wrong with the car?</Text>
              </View>
              <ChevronRight size={18} color={Colors.gray[400]} />
            </Pressable>
          </>
        )}

        {issueReports.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reported Issues</Text>
            {issueReports.map((report) => {
              const issueConfig = ISSUE_STATUS_CONFIG[report.status] ?? ISSUE_STATUS_CONFIG.open;
              return (
                <View key={report.id} style={styles.issueCard}>
                  <View style={styles.issueHeader}>
                    <Text style={styles.issueCategory}>{report.category}</Text>
                    <View style={[styles.issueStatusBadge, { backgroundColor: issueConfig.bg }]}>
                      <Text style={[styles.issueStatusText, { color: issueConfig.color }]}>{issueConfig.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.issueDescription}>{report.description}</Text>
                  {report.photoUrl && (
                    <Image source={{ uri: report.photoUrl }} style={styles.issuePhoto} contentFit="cover" />
                  )}
                </View>
              );
            })}
          </>
        )}

        {canReview && (
          <>
            <Text style={styles.sectionTitle}>Rate Your Trip</Text>
            <Pressable
              style={styles.reviewCard}
              onPress={() => router.push({ pathname: '/review', params: { bookingId: booking.id } })}
            >
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={24} color={Colors.gray[300]} />
                ))}
              </View>
              <Text style={styles.reviewPrompt}>Tap to leave a review</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  statusRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  statusBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: 'flex-start' as const,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  carCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  carImage: {
    width: 130,
    height: 130,
  },
  carInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center' as const,
  },
  carBrand: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  carModel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginBottom: 12,
    marginTop: 4,
  },
  ownerReviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ownerReviewCustomer: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  kycBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  ownerReviewActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 14,
  },
  reviewActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  declineBtn: {
    backgroundColor: Colors.error + '15',
  },
  reviewActionText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    paddingVertical: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginLeft: 32,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 1,
  },
  ownerCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  ownerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  ownerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.purple.deep,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ownerInitial: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  ownerPhone: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  ownerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  messageBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.purple.medium,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.info,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewStars: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 10,
  },
  reviewPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[500],
  },
  reportIssueCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  reportIssueLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  reportIssueIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.warning + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reportIssuePrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[800],
  },
  payNowCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  payNowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  payNowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.success + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  payNowPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[800],
  },
  payNowAmount: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  directPaymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
    gap: 14,
  },
  directPaymentAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  directPaymentHint: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: -8,
  },
  directPaymentRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  directPaymentLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[500],
  },
  directPaymentValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  directPaymentSubValue: {
    fontSize: 13,
    color: Colors.gray[600],
    marginTop: 1,
  },
  issueCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  issueCategory: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  issueStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  issueStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  issueDescription: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 19,
  },
  issuePhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginTop: 10,
  },
});
