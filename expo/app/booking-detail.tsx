import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockBookings } from '@/mocks/cars';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  pending: { icon: <Clock3 size={18} color={Colors.warning} />, color: Colors.warning, label: 'Pending Approval', bg: Colors.warning + '15' },
  approved: { icon: <CheckCircle2 size={18} color={Colors.info} />, color: Colors.info, label: 'Approved', bg: Colors.info + '15' },
  active: { icon: <Car size={18} color={Colors.success} />, color: Colors.success, label: 'Active Rental', bg: Colors.success + '15' },
  completed: { icon: <CheckCircle2 size={18} color={Colors.success} />, color: Colors.success, label: 'Completed', bg: Colors.success + '15' },
  cancelled: { icon: <XCircle size={18} color={Colors.error} />, color: Colors.error, label: 'Cancelled', bg: Colors.error + '15' },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const booking = mockBookings.find((b) => b.id === id);

  const config = booking ? STATUS_CONFIG[booking.status] : null;

  const handleWhatsApp = () => {
    if (!booking) return;
    const msg = `Hi, I have a booking for the ${booking.car.brand} ${booking.car.model} (Booking #${booking.id}).`;
    void Linking.openURL(`https://wa.me/${booking.car.ownerPhone.replace('+', '')}?text=${encodeURIComponent(msg)}`);
  };

  const handleCall = () => {
    if (!booking) return;
    void Linking.openURL(`tel:${booking.car.ownerPhone}`);
  };

  const canReview = booking?.status === 'completed';

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
          {config.icon}
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
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
            <Pressable style={styles.whatsappBtn} onPress={handleWhatsApp}>
              <MessageCircle size={16} color={Colors.white} />
            </Pressable>
            <Pressable style={styles.callBtn} onPress={handleCall}>
              <Phone size={16} color={Colors.white} />
            </Pressable>
          </View>
        </View>

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
  statusBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
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
  whatsappBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#25D366',
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
});
