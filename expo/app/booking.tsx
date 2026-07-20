import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, MapPin, Clock, ChevronDown, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LOCATIONS } from '@/constants/locations';
import { useCarDetails } from '@/lib/queries/cars';
import { useCreateBooking } from '@/lib/queries/bookings';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateDateRange(startOffset: number, count: number): { date: Date; label: string; value: string }[] {
  const today = new Date();
  const result: { date: Date; label: string; value: string }[] = [];
  for (let i = startOffset; i < startOffset + count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    const value = d.toISOString().split('T')[0];
    result.push({ date: d, label, value });
  }
  return result;
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: car, isLoading: isCarLoading } = useCarDetails(id);
  const { currentUser } = useAuth();
  const createBooking = useCreateBooking();

  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [pickupLocation, setPickupLocation] = useState(car?.location ?? 'Accra');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'pickup' | 'return' | null>(null);

  const totalDays = useMemo(() => {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diff = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [pickupDate, returnDate]);

  const pricing = useMemo(() => {
    if (!car) return { subtotal: 0, serviceFee: 0, insurance: 0, total: 0 };
    const subtotal = car.pricePerDay * totalDays;
    const serviceFee = Math.round(subtotal * 0.1);
    const insurance = Math.round(subtotal * 0.05);
    return { subtotal, serviceFee, insurance, total: subtotal + serviceFee + insurance };
  }, [car, totalDays]);

  const availableDates = useMemo(() => generateDateRange(0, 30), []);

  const handleConfirm = useCallback(() => {
    if (!car) return;
    createBooking.mutate(
      { carId: car.id, pickupDate, returnDate, pickupLocation },
      {
        onSuccess: (booking) => {
          const needsKyc = currentUser?.verificationStatus !== 'approved' && currentUser?.verificationStatus !== 'restricted';
          Alert.alert(
            'Booking Requested',
            needsKyc
              ? "Your request has been sent to the owner. Complete KYC verification so it can be approved once it's reviewed."
              : "Your request has been sent to the owner. They'll confirm availability and share payment details directly with you.",
            needsKyc
              ? [
                  { text: 'Later', style: 'cancel', onPress: () => router.replace({ pathname: '/booking-detail', params: { id: booking.id } }) },
                  {
                    text: 'Verify Now',
                    onPress: () => {
                      router.replace({ pathname: '/booking-detail', params: { id: booking.id } });
                      router.push('/kyc-verification');
                    },
                  },
                ]
              : [{ text: 'OK', onPress: () => router.replace({ pathname: '/booking-detail', params: { id: booking.id } }) }]
          );
        },
        onError: (err) => {
          Alert.alert('Booking Failed', getErrorMessage(err, 'Please try different dates.'));
        },
      }
    );
  }, [car, pickupDate, returnDate, pickupLocation, createBooking, router, currentUser?.verificationStatus]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (isCarLoading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Car not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.carSummary}>
          <Image source={{ uri: car.image }} style={styles.carImage} contentFit="cover" />
          <View style={styles.carInfo}>
            <Text style={styles.carBrand}>{car.brand}</Text>
            <Text style={styles.carModel}>{car.model}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>GH₵</Text>
              <Text style={styles.price}>{car.pricePerDay}</Text>
              <Text style={styles.perDay}>/day</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <View style={styles.dateRow}>
            <Pressable
              style={styles.dateCard}
              onPress={() => setShowDatePicker('pickup')}
            >
              <View style={styles.dateIconWrap}>
                <CalendarDays size={18} color={Colors.orange.primary} />
              </View>
              <Text style={styles.dateLabel}>Pickup</Text>
              <Text style={styles.dateValue}>{formatDate(pickupDate)}</Text>
            </Pressable>
            <View style={styles.dateDivider}>
              <Clock size={16} color={Colors.gray[400]} />
              <Text style={styles.daysText}>{totalDays} days</Text>
            </View>
            <Pressable
              style={styles.dateCard}
              onPress={() => setShowDatePicker('return')}
            >
              <View style={styles.dateIconWrap}>
                <CalendarDays size={18} color={Colors.purple.medium} />
              </View>
              <Text style={styles.dateLabel}>Return</Text>
              <Text style={styles.dateValue}>{formatDate(returnDate)}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <Pressable
            style={styles.locationSelector}
            onPress={() => setShowLocationPicker(!showLocationPicker)}
          >
            <MapPin size={18} color={Colors.orange.primary} />
            <Text style={styles.locationText}>{pickupLocation}</Text>
            <ChevronDown size={16} color={Colors.gray[500]} />
          </Pressable>
          {showLocationPicker && (
            <View style={styles.locationList}>
              {LOCATIONS.map((loc) => (
                <Pressable
                  key={loc}
                  style={[styles.locationOption, pickupLocation === loc && styles.locationOptionActive]}
                  onPress={() => { setPickupLocation(loc); setShowLocationPicker(false); }}
                >
                  <Text style={[styles.locationOptionText, pickupLocation === loc && styles.locationOptionTextActive]}>
                    {loc}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLineLabel}>GH₵{car.pricePerDay} × {totalDays} days</Text>
              <Text style={styles.priceLineValue}>GH₵{pricing.subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLineLabel}>Service Fee (10%)</Text>
              <Text style={styles.priceLineValue}>GH₵{pricing.serviceFee.toLocaleString()}</Text>
            </View>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLineLabel}>Insurance (5%)</Text>
              <Text style={styles.priceLineValue}>GH₵{pricing.insurance.toLocaleString()}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceLineItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>GH₵{pricing.total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

<View style={[styles.bottomBar, { bottom: getNavBarClearance(insets.bottom), paddingBottom: 10 }]}>
        <View>
          <Text style={styles.bottomTotal}>Total</Text>
          <Text style={styles.bottomPrice}>GH₵{pricing.total.toLocaleString()}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, (pressed || createBooking.isPending) && styles.confirmBtnPressed]}
          onPress={handleConfirm}
          disabled={createBooking.isPending}
          testID="confirm-booking-btn"
        >
          <Text style={styles.confirmBtnText}>{createBooking.isPending ? 'Requesting...' : 'Request Booking'}</Text>
        </Pressable>
      </View>

      <Modal
        visible={showDatePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showDatePicker === 'pickup' ? 'Select Pickup Date' : 'Select Return Date'}
              </Text>
              <Pressable onPress={() => setShowDatePicker(null)} style={styles.modalClose}>
                <X size={22} color={Colors.gray[600]} />
              </Pressable>
            </View>
            <FlatList
              data={availableDates}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.dateList}
              renderItem={({ item }) => {
                const isSelected =
                  (showDatePicker === 'pickup' && item.value === pickupDate) ||
                  (showDatePicker === 'return' && item.value === returnDate);
                const isDisabled =
                  showDatePicker === 'return' && new Date(item.value) <= new Date(pickupDate);
                return (
                  <Pressable
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionSelected,
                      isDisabled && styles.dateOptionDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      if (showDatePicker === 'pickup') {
                        setPickupDate(item.value);
                        if (new Date(item.value) >= new Date(returnDate)) {
                          const next = new Date(item.value);
                          next.setDate(next.getDate() + 3);
                          setReturnDate(next.toISOString().split('T')[0]);
                        }
                      } else {
                        setReturnDate(item.value);
                      }
                      setShowDatePicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateOptionLabel,
                        isSelected && styles.dateOptionLabelSelected,
                        isDisabled && styles.dateOptionLabelDisabled,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedDot} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  carSummary: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  carImage: {
    width: 120,
    height: 100,
  },
  carInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center' as const,
  },
  carBrand: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  carModel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginTop: 6,
  },
  currency: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  price: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
  perDay: {
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  dateCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.orange.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 2,
    textAlign: 'center' as const,
  },
  dateDivider: {
    alignItems: 'center' as const,
    gap: 4,
  },
  daysText: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '600' as const,
  },
  locationSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  locationList: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginTop: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  locationOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  locationOptionActive: {
    backgroundColor: Colors.orange.faint,
  },
  locationOptionText: {
    fontSize: 14,
    color: Colors.gray[700],
  },
  locationOptionTextActive: {
    color: Colors.orange.primary,
    fontWeight: '700' as const,
  },
  priceBreakdown: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  priceLineItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  priceLineLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  priceLineValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[800],
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.orange.primary,
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
  bottomTotal: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  confirmBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmBtnPressed: {
    backgroundColor: Colors.orange.bright,
    transform: [{ scale: 0.97 }],
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dateList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  dateOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: Colors.gray[50],
  },
  dateOptionSelected: {
    backgroundColor: Colors.orange.faint,
    borderWidth: 1,
    borderColor: Colors.orange.primary + '40',
  },
  dateOptionDisabled: {
    opacity: 0.4,
  },
  dateOptionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gray[800],
  },
  dateOptionLabelSelected: {
    color: Colors.orange.primary,
    fontWeight: '700' as const,
  },
  dateOptionLabelDisabled: {
    color: Colors.gray[400],
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange.primary,
  },
});
