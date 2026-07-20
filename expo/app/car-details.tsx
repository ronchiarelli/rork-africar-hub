import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Users,
  Gauge,
  Fuel,
  Snowflake,
  Share2,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Expand,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCarDetails, useIncrementCarViews } from '@/lib/queries/cars';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCTION_WEB_URL = 'https://gocar-hub.vercel.app';

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);

  const { data: car, isLoading } = useCarDetails(id);
  const getOrCreateConversation = useGetOrCreateConversation();
  const incrementCarViews = useIncrementCarViews();

  useEffect(() => {
    if (id) incrementCarViews.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleMessage = useCallback(() => {
    if (!car) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!car.ownerId) return;
    getOrCreateConversation.mutate(
      { otherUserId: car.ownerId, contextType: 'car', contextId: car.id, contextLabel: `${car.brand} ${car.model}` },
      {
        onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
        onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [car, currentUser, getOrCreateConversation, router]);

  const handleCall = useCallback(() => {
    if (!car) return;
    void Linking.openURL(`tel:${car.ownerPhone}`);
  }, [car]);

  const openGallery = useCallback((index: number) => {
    if (!car) return;
    router.push({ pathname: '/image-gallery', params: { carId: car.id, index: String(index) } });
  }, [car, router]);

  const goToHeroImage = useCallback((idx: number, total: number) => {
    const clamped = Math.max(0, Math.min(idx, total - 1));
    heroScrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setCurrentImageIndex(clamped);
  }, []);

  const handleShare = useCallback(() => {
    if (!car) return;
    void Share.share({
      message: `Check out this ${car.brand} ${car.model} on GoCar Hub — GH₵${car.pricePerDay}/day. ${PRODUCTION_WEB_URL}/car-details?id=${car.id}`,
      url: `${PRODUCTION_WEB_URL}/car-details?id=${car.id}`,
    }).catch(() => {
      Alert.alert('Could Not Share', 'Please try again.');
    });
  }, [car]);

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <ActivityIndicator size="large" color={Colors.orange.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: true, title: 'Not Found' }} />
        <Text style={styles.errorText}>Car not found</Text>
        <Pressable style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const favorited = isFavorite(car.id);
  // Sample/catalog cars (no real owner) aren't actually rentable.
  const isSampleCar = car.ownerId === null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(idx);
              }}
            >
              {car.images.map((img, idx) => (
                <Pressable key={idx} onPress={() => openGallery(idx)} testID={`hero-image-${idx}`}>
                  <Image source={{ uri: img }} style={styles.heroImage} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>

            <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
              <Pressable style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
                <ArrowLeft size={20} color={Colors.white} />
              </Pressable>
              <View style={styles.headerRight}>
                <Pressable style={styles.backBtn} onPress={() => toggleFavorite(car.id)} testID="fav-detail-btn">
                  <Heart size={20} color={favorited ? Colors.orange.primary : Colors.white} fill={favorited ? Colors.orange.primary : 'transparent'} />
                </Pressable>
                <Pressable style={styles.backBtn} onPress={handleShare} testID="share-btn">
                  <Share2 size={20} color={Colors.white} />
                </Pressable>
                <Pressable style={styles.backBtn} onPress={() => openGallery(currentImageIndex)} testID="expand-btn">
                  <Expand size={20} color={Colors.white} />
                </Pressable>
              </View>
            </View>

            {car.images.length > 1 && currentImageIndex > 0 && (
              <Pressable
                style={[styles.heroNavBtn, styles.heroNavBtnLeft]}
                onPress={() => goToHeroImage(currentImageIndex - 1, car.images.length)}
                testID="hero-prev-btn"
              >
                <ChevronLeft size={22} color={Colors.white} />
              </Pressable>
            )}
            {car.images.length > 1 && currentImageIndex < car.images.length - 1 && (
              <Pressable
                style={[styles.heroNavBtn, styles.heroNavBtnRight]}
                onPress={() => goToHeroImage(currentImageIndex + 1, car.images.length)}
                testID="hero-next-btn"
              >
                <ChevronRight size={22} color={Colors.white} />
              </Pressable>
            )}

            {car.images.length > 1 && (
              <View style={styles.dotsRow}>
                {car.images.map((_, idx) => (
                  <View key={idx} style={[styles.dot, idx === currentImageIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          {isSampleCar && (
            <View style={styles.bookedBadge} testID="car-details-booked-badge">
              <Text style={styles.bookedBadgeText}>Booked</Text>
            </View>
          )}
          <View style={styles.topRow}>
            <View style={styles.nameWrap}>
              <Text style={styles.brand}>{car.brand}</Text>
              <Text style={styles.model}>{car.model}</Text>
            </View>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{car.year}</Text>
            </View>
          </View>

          <View style={styles.ratingLocationRow}>
            <View style={styles.ratingWrap}>
              <Star size={16} color={Colors.star} fill={Colors.star} />
              <Text style={styles.ratingValue}>{car.rating}</Text>
              <Text style={styles.reviewCount}>({car.reviewCount} reviews)</Text>
            </View>
            <View style={styles.locationWrap}>
              <MapPin size={14} color={Colors.gray[500]} />
              <Text style={styles.locationText}>{car.location}</Text>
            </View>
          </View>

          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Users size={18} color={Colors.orange.primary} />
              </View>
              <Text style={styles.specValue}>{car.seats}</Text>
              <Text style={styles.specLabel}>Seats</Text>
            </View>
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Gauge size={18} color={Colors.orange.primary} />
              </View>
              <Text style={styles.specValue}>{car.horsepower}</Text>
              <Text style={styles.specLabel}>HP</Text>
            </View>
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Fuel size={18} color={Colors.orange.primary} />
              </View>
              <Text style={styles.specValue}>{car.fuelType}</Text>
              <Text style={styles.specLabel}>Fuel</Text>
            </View>
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Snowflake size={18} color={Colors.orange.primary} />
              </View>
              <Text style={styles.specValue}>{car.hasAC ? 'Yes' : 'No'}</Text>
              <Text style={styles.specLabel}>A/C</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Car</Text>
            <Text style={styles.description}>{car.description}</Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {car.features.map((feature, idx) => (
                <View key={idx} style={styles.featureChip}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Listed By</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatarWrap}>
                  <Text style={styles.ownerInitial}>{car.ownerName.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.ownerName}>{car.ownerName}</Text>
                  <Text style={styles.ownerPhone}>{car.ownerPhone}</Text>
                </View>
              </View>
              <View style={styles.ownerActions}>
                <Pressable style={styles.messageBtn} onPress={handleMessage} testID="car-details-message-btn">
                  <MessageCircle size={16} color={Colors.white} />
                </Pressable>
                <Pressable style={styles.callBtn} onPress={handleCall}>
                  <Phone size={16} color={Colors.white} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: getNavBarClearance(insets.bottom), paddingBottom: 10 }]}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>GH₵</Text>
            <Text style={styles.priceValue}>{car.pricePerDay}</Text>
            <Text style={styles.perDay}>/day</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.rentBtn, isSampleCar && styles.rentBtnDisabled, pressed && !isSampleCar && styles.rentBtnPressed]}
          onPress={() => router.push({ pathname: '/booking', params: { id: car.id } })}
          disabled={isSampleCar}
          testID="rent-now-btn"
        >
          <Text style={styles.rentBtnText}>{isSampleCar ? 'Booked' : 'Rent Now'}</Text>
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
  heroSection: {
    backgroundColor: Colors.purple.deep,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    position: 'relative' as const,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  headerOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerRight: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  dotsRow: {
    position: 'absolute' as const,
    bottom: 14,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: Colors.orange.primary,
    width: 20,
  },
  heroNavBtn: {
    position: 'absolute' as const,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroNavBtnLeft: {
    left: 12,
  },
  heroNavBtnRight: {
    right: 12,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: Colors.gray[50],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  topRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  nameWrap: {
    flex: 1,
  },
  brand: {
    fontSize: 14,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  model: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  yearBadge: {
    backgroundColor: Colors.purple.deep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  yearText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  ratingLocationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
  },
  ratingWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  locationWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500' as const,
  },
  specsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 24,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  specItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  specIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.orange.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  specLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 1,
  },
  descriptionSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.gray[600],
  },
  featuresSection: {
    marginTop: 24,
  },
  featuresGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  featureChip: {
    backgroundColor: Colors.purple.faint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.purple.medium,
  },
  ownerSection: {
    marginTop: 24,
  },
  ownerCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
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
    paddingTop: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  priceSection: {},
  priceLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  currency: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
  perDay: {
    fontSize: 13,
    color: Colors.gray[500],
    marginLeft: 2,
  },
  rentBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  rentBtnPressed: {
    backgroundColor: Colors.orange.bright,
    transform: [{ scale: 0.97 }],
  },
  rentBtnDisabled: {
    backgroundColor: Colors.gray[300],
  },
  rentBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  bookedBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookedBadgeText: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
});
