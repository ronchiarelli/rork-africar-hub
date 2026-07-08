import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Car, Wrench, CalendarCheck, AlertTriangle, Plus, Check, X, MapPin, MessageCircle, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMyFleetVehicles, usePendingOwnerBookings, type PendingBooking } from '@/lib/queries/fleet';
import { useReviewBooking } from '@/lib/queries/bookings';
import { getErrorMessage } from '@/lib/errors';

const VEHICLE_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Available' },
  rented: { bg: Colors.info + '20', text: Colors.info, label: 'Rented' },
  maintenance: { bg: Colors.warning + '20', text: Colors.warning, label: 'Maintenance' },
  inactive: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Inactive' },
};

export default function FleetDashboardScreen() {
  const router = useRouter();
  const { data: fleetVehicles = [] } = useMyFleetVehicles();
  const { data: pendingBookings = [] } = usePendingOwnerBookings();
  const reviewBooking = useReviewBooking();

  const earnings = useMemo(() => {
    const totalRevenue = fleetVehicles.reduce((s, v) => s + v.totalEarnings, 0);
    const completedTrips = fleetVehicles.reduce((s, v) => s + v.totalTrips, 0);
    const activeRentals = fleetVehicles.filter((v) => v.status === 'rented').length;
    const maintenanceCount = fleetVehicles.filter((v) => v.status === 'maintenance').length;
    return { totalRevenue, completedTrips, activeRentals, maintenanceCount };
  }, [fleetVehicles]);

  const handleWhatsApp = useCallback((booking: PendingBooking) => {
    if (!booking.customerPhone) return;
    const message = `Hi ${booking.customerName}, this is regarding your booking request for the ${booking.car.brand} ${booking.car.model}.`;
    void Linking.openURL(`https://wa.me/${booking.customerPhone.replace('+', '')}?text=${encodeURIComponent(message)}`);
  }, []);

  const handleCall = useCallback((booking: PendingBooking) => {
    if (!booking.customerPhone) return;
    void Linking.openURL(`tel:${booking.customerPhone}`);
  }, []);

  const handleReview = (bookingId: string, decision: 'approved' | 'cancelled') => {
    reviewBooking.mutate(
      { bookingId, decision },
      {
        onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this booking.')),
      }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
        </View>

        {pendingBookings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Booking Requests</Text>
            {pendingBookings.map((booking) => (
              <View key={booking.id} style={styles.requestCard}>
                <Image source={{ uri: booking.car.image }} style={styles.requestImage} contentFit="cover" />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestModel} numberOfLines={1}>{booking.car.brand} {booking.car.model}</Text>
                  <Text style={styles.requestCustomer} numberOfLines={1}>{booking.customerName}</Text>
                  <View style={styles.requestDetailRow}>
                    <MapPin size={11} color={Colors.gray[500]} />
                    <Text style={styles.requestDetailText}>{booking.pickupLocation}</Text>
                  </View>
                  <Text style={styles.requestDetailText}>{booking.pickupDate} → {booking.returnDate} ({booking.totalDays}d)</Text>
                  <Text style={styles.requestPrice}>GH₵{booking.totalPrice.toLocaleString()}</Text>
                  {booking.customerPhone ? (
                    <View style={styles.contactRow}>
                      <Pressable style={styles.whatsappBtn} onPress={() => handleWhatsApp(booking)} testID={`booking-whatsapp-${booking.id}`}>
                        <MessageCircle size={14} color={Colors.white} />
                        <Text style={styles.contactBtnText}>WhatsApp</Text>
                      </Pressable>
                      <Pressable style={styles.callBtn} onPress={() => handleCall(booking)} testID={`booking-call-${booking.id}`}>
                        <Phone size={14} color={Colors.white} />
                      </Pressable>
                    </View>
                  ) : null}
                  <View style={styles.requestActions}>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReview(booking.id, 'cancelled')}
                      disabled={reviewBooking.isPending}
                    >
                      <X size={14} color={Colors.error} />
                      <Text style={[styles.actionBtnText, { color: Colors.error }]}>Decline</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleReview(booking.id, 'approved')}
                      disabled={reviewBooking.isPending}
                    >
                      <Check size={14} color={Colors.white} />
                      <Text style={[styles.actionBtnText, { color: Colors.white }]}>Approve</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.fleetHeader}>
          <Text style={styles.sectionTitle}>My Fleet</Text>
          <Pressable style={styles.addCarBtn} onPress={() => router.push('/add-car')} testID="add-car-btn">
            <Plus size={16} color={Colors.white} />
            <Text style={styles.addCarBtnText}>Add Car</Text>
          </Pressable>
        </View>

        {fleetVehicles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Car size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>You haven&apos;t listed any cars yet</Text>
          </View>
        ) : (
          fleetVehicles.map((vehicle) => {
            const statusConfig = VEHICLE_STATUS_CONFIG[vehicle.status] ?? VEHICLE_STATUS_CONFIG.active;
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
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
                  {vehicle.status === 'maintenance' && vehicle.nextMaintenance ? (
                    <View style={styles.maintenanceAlert}>
                      <AlertTriangle size={12} color={Colors.warning} />
                      <Text style={styles.maintenanceText}>Due: {vehicle.nextMaintenance}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
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
  whatsappBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#25D366',
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
});
