import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useBookings } from '@/lib/queries/bookings';
import { Booking } from '@/types/car';

const TABS = ['All', 'Active', 'Upcoming', 'Completed'] as const;
type TabType = typeof TABS[number];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: Colors.warning + '20', text: Colors.warning, label: 'Pending' },
  approved: { bg: Colors.info + '20', text: Colors.info, label: 'Approved' },
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Active' },
  completed: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Completed' },
  cancelled: { bg: Colors.error + '20', text: Colors.error, label: 'Cancelled' },
};

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  return (
    <Pressable
      style={styles.bookingCard}
      onPress={() => router.push({ pathname: '/booking-detail', params: { id: booking.id } })}
      testID={`booking-${booking.id}`}
    >
      <View style={styles.bookingRow}>
        <Image source={{ uri: booking.car.image }} style={styles.bookingImage} contentFit="cover" />
        <View style={styles.bookingInfo}>
          <View style={styles.bookingTop}>
            <View style={styles.bookingNameWrap}>
              <Text style={styles.bookingBrand}>{booking.car.brand}</Text>
              <Text style={styles.bookingModel} numberOfLines={1}>{booking.car.model}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailItem}>
              <CalendarDays size={12} color={Colors.gray[500]} />
              <Text style={styles.detailText}>{booking.pickupDate} → {booking.returnDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin size={12} color={Colors.gray[500]} />
              <Text style={styles.detailText}>{booking.pickupLocation}</Text>
            </View>
          </View>

          <View style={styles.bookingBottom}>
            <View style={styles.priceWrap}>
              <Text style={styles.bookingCurrency}>GH₵</Text>
              <Text style={styles.bookingPrice}>{booking.totalPrice.toLocaleString()}</Text>
              <Text style={styles.bookingDays}> · {booking.totalDays} days</Text>
            </View>
            <ChevronRight size={16} color={Colors.gray[400]} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const { data: bookings = [] } = useBookings();

  const filteredBookings = useMemo(() => {
    if (activeTab === 'Active') return bookings.filter(b => b.status === 'active' || b.status === 'approved');
    if (activeTab === 'Upcoming') return bookings.filter(b => b.status === 'pending');
    if (activeTab === 'Completed') return bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
    return bookings;
  }, [bookings, activeTab]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Clock size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>Your {activeTab.toLowerCase()} bookings will appear here</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
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
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  tabsRow: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  tabActive: {
    backgroundColor: Colors.orange.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
  },
  bookingRow: {
    flexDirection: 'row' as const,
  },
  bookingImage: {
    width: 110,
    height: 130,
  },
  bookingInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between' as const,
  },
  bookingTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  bookingNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  bookingBrand: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  bookingModel: {
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
  bookingDetails: {
    gap: 4,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  bookingBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  priceWrap: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  bookingCurrency: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
  bookingDays: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  emptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center' as const,
  },
});
