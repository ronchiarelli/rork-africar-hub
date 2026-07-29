import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { Car, Wrench, CalendarCheck, AlertTriangle, Plus, Check, X, MapPin, MessageCircle, Phone, Pencil, ShieldCheck, Eye, BarChart3, Search, Trash2, Sparkles, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AnimatedApproveButton from '@/components/AnimatedApproveButton';
import TrendLineChart from '@/components/TrendLineChart';
import { getNavBarClearance } from '@/components/BottomNavBar';
import TipBanner from '@/components/TipBanner';
import KycReminderBanner from '@/components/KycReminderBanner';
import { useMyFleetVehicles, usePendingOwnerBookings, useFleetMonthlyTrends, useFleetTopCars, useSetCarAvailability, useDeleteCar, type PendingBooking } from '@/lib/queries/fleet';
import { useReviewBooking } from '@/lib/queries/bookings';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { useInitiateFeaturedPayment } from '@/lib/queries/featured';
import { getErrorMessage } from '@/lib/errors';

// Marker URL for openAuthSessionAsync to watch for — see payment-bridge.tsx.
const PAYMENT_RETURN_SCHEME_URL = 'gocarhub://payment-return';

const VEHICLE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Available' },
  rented: { bg: Colors.info + '20', text: Colors.info, label: 'Rented' },
  maintenance: { bg: Colors.warning + '20', text: Colors.warning, label: 'Maintenance' },
  inactive: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Inactive' },
};

const KYC_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: Colors.gray[200], text: Colors.gray[600], label: 'KYC Not Started' },
  pending: { bg: Colors.warning + '20', text: Colors.warning, label: 'KYC Pending Review' },
  restricted: { bg: Colors.info + '20', text: Colors.info, label: 'ID Verified (Restricted)' },
  approved: { bg: Colors.success + '20', text: Colors.success, label: 'KYC Verified' },
  rejected: { bg: Colors.error + '20', text: Colors.error, label: 'KYC Rejected' },
  // Admin waived the document requirement for this customer — they're
  // approvable even though no documents were ever uploaded.
  exempt: { bg: Colors.success + '20', text: Colors.success, label: 'Verified by Admin' },
};

export default function FleetDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: fleetVehicles = [] } = useMyFleetVehicles();
  const { data: pendingBookings = [] } = usePendingOwnerBookings();
  const { data: monthlyTrends = [] } = useFleetMonthlyTrends();
  const { data: topCars = [] } = useFleetTopCars();
  const reviewBooking = useReviewBooking();
  const getOrCreateConversation = useGetOrCreateConversation();
  const setCarAvailability = useSetCarAvailability();
  const deleteCar = useDeleteCar();
  const initiateFeaturedPayment = useInitiateFeaturedPayment();
  const queryClient = useQueryClient();
  const [inventoryQuery, setInventoryQuery] = useState('');

  const filteredFleetVehicles = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase();
    if (!q) return fleetVehicles;
    return fleetVehicles.filter(
      (v) => v.car.brand.toLowerCase().includes(q) || v.car.model.toLowerCase().includes(q)
    );
  }, [fleetVehicles, inventoryQuery]);

  const handleToggleAvailability = useCallback((carId: string, next: boolean) => {
    setCarAvailability.mutate(
      { carId, isAvailable: next },
      { onError: (err) => Alert.alert('Could not update', getErrorMessage(err, 'Please try again.')) }
    );
  }, [setCarAvailability]);

  const handleDeleteVehicle = useCallback((carId: string, label: string) => {
    Alert.alert('Delete Vehicle', `Remove ${label} from your fleet? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCar.mutate(carId, {
            onError: (err) => Alert.alert('Could not delete', getErrorMessage(err, 'Please try again.')),
          });
        },
      },
    ]);
  }, [deleteCar]);

  // openAuthSessionAsync watches for a redirect back to
  // PAYMENT_RETURN_SCHEME_URL and resolves as soon as it happens — see
  // payment-bridge.tsx for why that has to be our own gocarhub:// scheme
  // rather than the https returnUrl the edge function told Hubtel to use.
  const handleFeatureCar = useCallback((carId: string, placement: 'marketplace' | 'home', label: string) => {
    initiateFeaturedPayment.mutate(
      { targetType: 'car', targetId: carId, placement },
      {
        onSuccess: async (data) => {
          if (Platform.OS === 'web') {
            window.open(data.checkoutUrl, '_blank');
            return;
          }
          const result = await WebBrowser.openAuthSessionAsync(data.checkoutUrl, PAYMENT_RETURN_SCHEME_URL, {
            preferEphemeralSession: true,
          });
          if (result.type === 'success') {
            const cancelled = result.url.includes('featured=cancelled');
            void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles'] });
            void queryClient.invalidateQueries({ queryKey: ['cars'] });
            setTimeout(() => {
              void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles'] });
              void queryClient.invalidateQueries({ queryKey: ['cars'] });
            }, 2500);
            if (!cancelled) {
              Alert.alert('Payment Received', `${label} will be featured shortly.`);
            }
          }
        },
        onError: (err) => Alert.alert('Could not start payment', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [initiateFeaturedPayment, queryClient]);

  const earnings = useMemo(() => {
    const totalRevenue = fleetVehicles.reduce((s, v) => s + v.totalEarnings, 0);
    const completedTrips = fleetVehicles.reduce((s, v) => s + v.totalTrips, 0);
    const activeRentals = fleetVehicles.filter((v) => v.status === 'rented').length;
    const maintenanceCount = fleetVehicles.filter((v) => v.status === 'maintenance').length;
    const totalViews = fleetVehicles.reduce((s, v) => s + v.car.views, 0);
    return { totalRevenue, completedTrips, activeRentals, maintenanceCount, totalViews };
  }, [fleetVehicles]);

  const handleMessage = useCallback((booking: PendingBooking) => {
    getOrCreateConversation.mutate(
      { otherUserId: booking.customerId, contextType: 'booking', contextId: booking.id, contextLabel: `${booking.car.brand} ${booking.car.model}` },
      {
        onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
        onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [getOrCreateConversation, router]);

  const handleCall = useCallback((booking: PendingBooking) => {
    if (!booking.customerPhone) return;
    void Linking.openURL(`tel:${booking.customerPhone}`);
  }, []);

  const handleReview = (booking: PendingBooking, decision: 'approved' | 'cancelled') => {
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <KycReminderBanner />
        <TipBanner
          id="fleet-dashboard-howto"
          text="Review a renter's KYC status before approving a booking request. Tap 'Add Car' to list a new vehicle for rent."
          testID="fleet-dashboard-tip-banner"
        />

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Total Revenue</Text>
          <Text style={styles.earningsValue}>GH₵{earnings.totalRevenue.toLocaleString()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <CalendarCheck size={20} color={Colors.info} />
            <Text style={styles.statValue}>{earnings.completedTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Car size={20} color={Colors.success} />
            <Text style={styles.statValue}>{earnings.activeRentals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Wrench size={20} color={Colors.warning} />
            <Text style={styles.statValue}>{earnings.maintenanceCount}</Text>
            <Text style={styles.statLabel}>Service</Text>
          </View>
          <View style={styles.statCard}>
            <Eye size={20} color={Colors.purple.medium} />
            <Text style={styles.statValue}>{earnings.totalViews}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {pendingBookings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Booking Requests</Text>
            {pendingBookings.map((booking) => {
              const kycConfig = booking.customerKycExempt
                ? KYC_STATUS_CONFIG.exempt
                : KYC_STATUS_CONFIG[booking.customerVerificationStatus] ?? KYC_STATUS_CONFIG.none;
              return (
              <View key={booking.id} style={styles.requestCard}>
                <Image source={{ uri: booking.car.image }} style={styles.requestImage} contentFit="cover" />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestModel} numberOfLines={1}>{booking.car.brand} {booking.car.model}</Text>
                  <Text style={styles.requestCustomer} numberOfLines={1}>{booking.customerName}</Text>
                  <Pressable
                    style={[styles.kycBadge, { backgroundColor: kycConfig.bg }]}
                    onPress={() => router.push({ pathname: '/renter-kyc', params: { userId: booking.customerId, name: booking.customerName } })}
                    testID={`booking-view-kyc-${booking.id}`}
                  >
                    <ShieldCheck size={11} color={kycConfig.text} />
                    <Text style={[styles.kycBadgeText, { color: kycConfig.text }]}>{kycConfig.label}</Text>
                  </Pressable>
                  <View style={styles.requestDetailRow}>
                    <MapPin size={11} color={Colors.gray[500]} />
                    <Text style={styles.requestDetailText}>{booking.pickupLocation}</Text>
                  </View>
                  <Text style={styles.requestDetailText}>{booking.pickupDate} → {booking.returnDate} ({booking.totalDays}d)</Text>
                  <Text style={styles.requestPrice}>GH₵{booking.totalPrice.toLocaleString()}</Text>
                  <View style={styles.contactRow}>
                    <Pressable style={styles.messageBtn} onPress={() => handleMessage(booking)} testID={`booking-message-${booking.id}`}>
                      <MessageCircle size={14} color={Colors.white} />
                      <Text style={styles.contactBtnText}>Message</Text>
                    </Pressable>
                    {booking.customerPhone ? (
                      <Pressable style={styles.callBtn} onPress={() => handleCall(booking)} testID={`booking-call-${booking.id}`}>
                        <Phone size={14} color={Colors.white} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReview(booking, 'cancelled')}
                      disabled={reviewBooking.isPending}
                    >
                      <X size={14} color={Colors.error} />
                      <Text style={[styles.actionBtnText, { color: Colors.error }]}>Decline</Text>
                    </Pressable>
                    <AnimatedApproveButton
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleReview(booking, 'approved')}
                      disabled={reviewBooking.isPending}
                    >
                      <Check size={14} color={Colors.white} />
                      <Text style={[styles.actionBtnText, { color: Colors.white }]}>Approve</Text>
                    </AnimatedApproveButton>
                  </View>
                </View>
              </View>
              );
            })}
          </>
        )}

        <View style={styles.fleetHeader}>
          <Text style={styles.sectionTitle}>My Fleet</Text>
          <Pressable style={styles.addCarBtn} onPress={() => router.push('/add-car')} testID="add-car-btn">
            <Plus size={16} color={Colors.white} />
            <Text style={styles.addCarBtnText}>Add Car</Text>
          </Pressable>
        </View>

        {fleetVehicles.length > 0 && (
          <View style={styles.inventorySearchWrap}>
            <Search size={16} color={Colors.gray[400]} />
            <TextInput
              style={styles.inventorySearchInput}
              placeholder="Search your fleet by brand or model..."
              placeholderTextColor={Colors.gray[400]}
              value={inventoryQuery}
              onChangeText={setInventoryQuery}
              testID="fleet-inventory-search"
            />
          </View>
        )}

        {fleetVehicles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Car size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>You haven&apos;t listed any cars yet</Text>
          </View>
        ) : filteredFleetVehicles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Search size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No vehicles match &quot;{inventoryQuery}&quot;</Text>
          </View>
        ) : (
          filteredFleetVehicles.map((vehicle) => {
            const statusConfig = VEHICLE_STATUS_CONFIG[vehicle.status] ?? VEHICLE_STATUS_CONFIG.active;
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <Pressable
                  style={styles.vehicleCardMain}
                  onPress={() => router.push({ pathname: '/add-car', params: { id: vehicle.carId } })}
                  testID={`edit-vehicle-${vehicle.carId}`}
                >
                  <Image source={{ uri: vehicle.car.image }} style={styles.vehicleImage} contentFit="cover" />
                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleNameWrap}>
                        <Text style={styles.vehicleBrand}>{vehicle.car.brand}</Text>
                        <Text style={styles.vehicleModel} numberOfLines={1}>{vehicle.car.model}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                      </View>
                    </View>
                    <View style={styles.vehicleStats}>
                      <Text style={styles.vehicleStat}>{vehicle.totalTrips} trips</Text>
                      <Text style={styles.vehicleDot}>·</Text>
                      <Text style={styles.vehicleStat}>GH₵{vehicle.totalEarnings.toLocaleString()}</Text>
                    </View>
                    {vehicle.car.approvalStatus !== 'approved' && (
                      <View style={styles.listingReviewNote}>
                        <AlertTriangle size={12} color={vehicle.car.approvalStatus === 'rejected' ? Colors.error : Colors.warning} />
                        <Text style={[styles.listingReviewText, vehicle.car.approvalStatus === 'rejected' && { color: Colors.error }]}>
                          {vehicle.car.approvalStatus === 'rejected'
                            ? vehicle.car.rejectionReason || 'Rejected — edit and resubmit'
                            : 'Awaiting admin review — not visible to customers yet'}
                        </Text>
                      </View>
                    )}
                    {vehicle.status === 'maintenance' && vehicle.nextMaintenance ? (
                      <View style={styles.maintenanceAlert}>
                        <AlertTriangle size={12} color={Colors.warning} />
                        <Text style={styles.maintenanceText}>Due: {vehicle.nextMaintenance}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.editIconWrap}>
                    <Pencil size={14} color={Colors.gray[400]} />
                  </View>
                </Pressable>
                <View style={styles.vehicleActionsRow}>
                  <View style={styles.availabilityToggle}>
                    <Text style={styles.availabilityLabel}>
                      {vehicle.car.isAvailable ? 'Available for booking' : 'Unavailable'}
                    </Text>
                    <Switch
                      value={vehicle.car.isAvailable}
                      onValueChange={(next) => handleToggleAvailability(vehicle.carId, next)}
                      trackColor={{ false: Colors.gray[300], true: Colors.success + '80' }}
                      thumbColor={vehicle.car.isAvailable ? Colors.success : Colors.gray[100]}
                      testID={`availability-switch-${vehicle.carId}`}
                    />
                  </View>
                  <Pressable
                    style={styles.deleteVehicleBtn}
                    onPress={() => handleDeleteVehicle(vehicle.carId, `${vehicle.car.brand} ${vehicle.car.model}`)}
                    testID={`delete-vehicle-${vehicle.carId}`}
                  >
                    <Trash2 size={14} color={Colors.error} />
                    <Text style={styles.deleteVehicleText}>Delete</Text>
                  </Pressable>
                </View>
                <View style={styles.featureRow}>
                  {vehicle.car.isFeatured ? (
                    <View style={styles.featuredBadgeSmall}>
                      <View style={styles.featuredBadgeIconWrap}>
                        <Check size={15} color={Colors.white} />
                      </View>
                      <View style={styles.featureTextWrap}>
                        <Text style={styles.featuredBadgeTitle}>Featured Carousel</Text>
                        <Text style={styles.featuredBadgeSubtitle}>Active placement</Text>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.featureBtn, pressed && styles.featureBtnPressed]}
                      onPress={() => handleFeatureCar(vehicle.carId, 'marketplace', `${vehicle.car.brand} ${vehicle.car.model}`)}
                      testID={`feature-search-${vehicle.carId}`}
                    >
                      <View style={styles.featureBtnIconWrap}>
                        <Sparkles size={15} color={Colors.white} />
                      </View>
                      <View style={styles.featureTextWrap}>
                        <Text style={styles.featureBtnTitle}>Boost Views</Text>
                        <Text style={styles.featureBtnSubtitle}>Featured Carousel · GH₵300/mo</Text>
                      </View>
                      <ChevronRight size={18} color={Colors.gray[300]} />
                    </Pressable>
                  )}
                  {vehicle.car.isHomeFeatured ? (
                    <View style={styles.featuredBadgeSmall}>
                      <View style={styles.featuredBadgeIconWrap}>
                        <Check size={15} color={Colors.white} />
                      </View>
                      <View style={styles.featureTextWrap}>
                        <Text style={styles.featuredBadgeTitle}>Marketplace Carousel</Text>
                        <Text style={styles.featuredBadgeSubtitle}>Active placement</Text>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.featureBtn, pressed && styles.featureBtnPressed]}
                      onPress={() => handleFeatureCar(vehicle.carId, 'home', `${vehicle.car.brand} ${vehicle.car.model}`)}
                      testID={`feature-home-${vehicle.carId}`}
                    >
                      <View style={styles.featureBtnIconWrap}>
                        <Sparkles size={15} color={Colors.white} />
                      </View>
                      <View style={styles.featureTextWrap}>
                        <Text style={styles.featureBtnTitle}>Boost Views</Text>
                        <Text style={styles.featureBtnSubtitle}>Marketplace Carousel · GH₵250/mo</Text>
                      </View>
                      <ChevronRight size={18} color={Colors.gray[300]} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, styles.analyticsSectionTitle]}>Analytics (Last 6 Months)</Text>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Bookings &amp; Revenue Trend</Text>
          <TrendLineChart
            xLabels={monthlyTrends.map((t) => new Date(t.monthStart).toLocaleDateString('en-US', { month: 'short' }))}
            series={[
              { label: 'Bookings', color: Colors.orange.primary, values: monthlyTrends.map((t) => t.bookings) },
              { label: 'Revenue (GH₵)', color: Colors.info, values: monthlyTrends.map((t) => t.revenue) },
            ]}
          />
        </View>

        <Text style={styles.sectionTitle}>Top Cars</Text>
        {topCars.map((car, idx) => {
          const maxBookings = Math.max(1, ...topCars.map((c) => c.bookingCount));
          const maxViews = Math.max(1, ...topCars.map((c) => c.views));
          return (
            <View key={car.carId} style={styles.topCarCard}>
              <Text style={styles.topCarRank}>#{idx + 1}</Text>
              <Image source={{ uri: car.image }} style={styles.topCarImage} contentFit="cover" />
              <View style={styles.topCarInfo}>
                <Text style={styles.topCarName}>{car.brand} {car.model}</Text>
                <View style={styles.topCarBarRow}>
                  <Text style={styles.topCarBarLabel}>Bookings</Text>
                  <View style={styles.topCarBarTrack}>
                    <View style={[styles.topCarBarFill, { width: `${Math.max(4, (car.bookingCount / maxBookings) * 100)}%`, backgroundColor: Colors.orange.primary }]} />
                  </View>
                  <Text style={styles.topCarBarValue}>{car.bookingCount}</Text>
                </View>
                <View style={styles.topCarBarRow}>
                  <Text style={styles.topCarBarLabel}>Views</Text>
                  <View style={styles.topCarBarTrack}>
                    <View style={[styles.topCarBarFill, { width: `${Math.max(4, (car.views / maxViews) * 100)}%`, backgroundColor: Colors.info }]} />
                  </View>
                  <Text style={styles.topCarBarValue}>{car.views}</Text>
                </View>
              </View>
            </View>
          );
        })}
        {topCars.length === 0 && (
          <View style={styles.emptyWrap}>
            <BarChart3 size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No cars yet</Text>
          </View>
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
    paddingBottom: 30,
  },
  earningsCard: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500' as const,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  fleetHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  addCarBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  addCarBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  requestCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  requestImage: {
    width: 100,
    height: 150,
  },
  requestInfo: {
    flex: 1,
    padding: 12,
  },
  requestModel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  requestCustomer: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  kycBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  requestDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  requestDetailText: {
    fontSize: 11,
    color: Colors.gray[600],
    marginTop: 2,
  },
  requestPrice: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.orange.primary,
    marginTop: 6,
  },
  contactRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  messageBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.purple.medium,
    flex: 1,
  },
  callBtn: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.info,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  requestActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.error + '15',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  vehicleCardMain: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  vehicleActionsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  availabilityToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
  deleteVehicleBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.error + '10',
  },
  deleteVehicleText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  featureRow: {
    flexDirection: 'column' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  featureBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.orange.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  featureBtnPressed: {
    backgroundColor: Colors.orange.faint,
    borderColor: Colors.orange.primary,
  },
  featureBtnIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureBtnTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  featureBtnSubtitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.gray[500],
    marginTop: 1,
  },
  featuredBadgeSmall: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.success + '0D',
    borderWidth: 1.5,
    borderColor: Colors.success + '40',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featuredBadgeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featuredBadgeTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  featuredBadgeSubtitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
    marginTop: 1,
  },
  inventorySearchWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inventorySearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.gray[900],
  },
  editIconWrap: {
    paddingHorizontal: 14,
  },
  vehicleImage: {
    width: 110,
    height: 110,
  },
  vehicleInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center' as const,
  },
  vehicleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  vehicleNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  vehicleBrand: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  vehicleStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 8,
  },
  vehicleStat: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  vehicleDot: {
    color: Colors.gray[400],
  },
  listingReviewNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 6,
  },
  listingReviewText: { fontSize: 11, fontWeight: '600' as const, color: Colors.warning, flex: 1 },
  maintenanceAlert: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 6,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  maintenanceText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
  analyticsSectionTitle: {
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900], marginBottom: 4 },
  topCarCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topCarRank: { fontSize: 16, fontWeight: '800' as const, color: Colors.gray[400], width: 28 },
  topCarImage: { width: 50, height: 50, borderRadius: 10 },
  topCarInfo: { flex: 1 },
  topCarName: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900], marginBottom: 6 },
  topCarBarRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 4,
  },
  topCarBarLabel: {
    fontSize: 10,
    color: Colors.gray[500],
    fontWeight: '600' as const,
    width: 48,
  },
  topCarBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  topCarBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  topCarBarValue: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    width: 24,
    textAlign: 'right' as const,
  },
});
