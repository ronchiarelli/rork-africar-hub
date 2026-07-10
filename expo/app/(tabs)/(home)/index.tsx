import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Animated,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Heart, MessageSquare, Search, ChevronRight, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCars, useBrands, useSaleCars } from '@/lib/queries/cars';
import { useActiveBanner } from '@/lib/queries/banners';
import type { BannerCtaTypeDb } from '@/types/database';
import { useUnreadConversationsCount } from '@/lib/queries/chat';
import { useNotifications } from '@/lib/queries/notifications';
import NotificationBadge from '@/components/NotificationBadge';
import { useAuth } from '@/providers/AuthProvider';
import CarCard from '@/components/CarCard';
import BrandCard from '@/components/BrandCard';
import { Brand, SaleCar } from '@/types/car';

function SaleCarCard({ car }: { car: SaleCar }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[saleStyles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push('/marketplace')}
      >
        <View style={saleStyles.imageWrap}>
          <Image source={{ uri: car.image }} style={saleStyles.image} contentFit="cover" />
          {car.isFeatured && (
            <View style={saleStyles.featuredBadge}>
              <Sparkles size={10} color={Colors.white} />
              <Text style={saleStyles.featuredText}>Featured</Text>
            </View>
          )}
          <View style={saleStyles.conditionBadge}>
            <Text style={saleStyles.conditionText}>{car.condition}</Text>
          </View>
        </View>
        <View style={saleStyles.info}>
          <Text style={saleStyles.brand}>{car.brand}</Text>
          <Text style={saleStyles.model} numberOfLines={1}>{car.model}</Text>
          <View style={saleStyles.detailRow}>
            <Text style={saleStyles.year}>{car.year}</Text>
            <Text style={saleStyles.dot}>·</Text>
            <Text style={saleStyles.mileage}>{(car.mileage / 1000).toFixed(0)}k km</Text>
          </View>
          <View style={saleStyles.priceRow}>
            <Text style={saleStyles.currency}>GH₵</Text>
            <Text style={saleStyles.price}>{car.salePrice.toLocaleString()}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');
  const { data: brands = [] } = useBrands();
  const { data: cars = [] } = useCars({ onlyAvailable: true });
  const { data: saleCars = [] } = useSaleCars();
  const { data: banner } = useActiveBanner();
  const unreadMessages = useUnreadConversationsCount();
  const { data: notifications = [] } = useNotifications();
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleBrandPress = useCallback((brand: Brand) => {
    router.push({ pathname: '/search', params: { brand: brand.name } });
  }, [router]);

  const handleBannerPress = useCallback((ctaType: BannerCtaTypeDb, destination: string) => {
    if (ctaType === 'url') {
      void Linking.openURL(destination);
    } else if (ctaType === 'phone') {
      void Linking.openURL(`tel:${destination}`);
    } else {
      router.push(destination as never);
    }
  }, [router]);

  const featuredSaleCars = saleCars.filter(c => c.isFeatured);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View style={styles.locationWrap}>
              <MapPin size={16} color={Colors.orange.primary} />
              <Text style={styles.locationLabel}>Location</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('/favorites')} style={styles.iconBtn} testID="fav-header-btn">
                <Heart size={20} color={Colors.white} />
              </Pressable>
              <Pressable onPress={() => router.push('/messages')} style={styles.iconBtn} testID="messages-header-btn">
                <MessageSquare size={20} color={Colors.white} />
                {unreadMessages > 0 && <View style={styles.notifDot} />}
              </Pressable>
              <Pressable onPress={() => router.push('/notifications')} style={styles.iconBtn} testID="notif-header-btn">
                <Bell size={20} color={Colors.white} />
                {unreadNotifications > 0 && (
                  <View style={styles.notifBadgeWrap}>
                    <NotificationBadge count={unreadNotifications} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          <Text style={styles.greeting}>Hello, {currentUser?.name?.split(' ')[0] ?? 'Guest'}</Text>
          <Text style={styles.subtitle}>Find your perfect ride today</Text>

          <View style={styles.searchBar}>
            <Search size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cars, brands, locations..."
              placeholderTextColor={Colors.gray[400]}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => router.push('/search')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top <Text style={styles.highlight}>Brands</Text></Text>
            <Pressable onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={brands}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BrandCard brand={item} onPress={handleBrandPress} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending <Text style={styles.highlight}>Cars</Text></Text>
            <Pressable onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={cars.filter(c => c.isAvailable)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CarCard car={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
          />
        </View>

        {banner && (
          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>{banner.tag}</Text>
              <Text style={styles.promoTitle}>{banner.title}</Text>
              <Text style={styles.promoSub}>{banner.subtitle}</Text>
              <Pressable style={styles.promoBtn} onPress={() => handleBannerPress(banner.ctaType, banner.ctaRoute)}>
                <Text style={styles.promoBtnText}>{banner.ctaLabel}</Text>
              </Pressable>
            </View>
            <Image
              source={{ uri: banner.imageUrl }}
              style={styles.promoImage}
              contentFit="cover"
              contentPosition={{ left: `${banner.focalX}%`, top: `${banner.focalY}%` }}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cars For <Text style={styles.highlight}>Sale</Text></Text>
            <Pressable onPress={() => router.push('/marketplace')}>
              <View style={styles.seeAllBtn}>
                <Text style={styles.seeAll}>Marketplace</Text>
                <ChevronRight size={14} color={Colors.orange.primary} />
              </View>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={featuredSaleCars}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SaleCarCard car={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Near <Text style={styles.highlight}>You</Text></Text>
          </View>
          {cars.filter(c => c.isAvailable).slice(0, 3).map((car) => (
            <CarCard key={car.id} car={car} variant="horizontal" />
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: 28 }]}
        onPress={() => router.push('/search')}
        accessibilityLabel="Search cars"
      >
        <Search size={22} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const saleStyles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden' as const,
  },
  imageWrap: {
    width: '100%',
    height: 120,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  featuredText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  conditionBadge: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  info: {
    padding: 12,
  },
  brand: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  model: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  year: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  dot: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  mileage: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginTop: 6,
  },
  currency: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  price: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.purple.deep,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  locationWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  locationLabel: {
    color: Colors.gray[300],
    fontSize: 13,
    fontWeight: '500' as const,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  notifDot: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.orange.primary,
  },
  notifBadgeWrap: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
  },
  greeting: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.gray[400],
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400' as const,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginTop: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  highlight: {
    color: Colors.orange.primary,
  },
  seeAll: {
    color: Colors.orange.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  seeAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  brandList: {
    paddingRight: 20,
  },
  carList: {
    paddingRight: 20,
  },
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    overflow: 'hidden' as const,
    flexDirection: 'row' as const,
    height: 150,
  },
  promoContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'center' as const,
  },
  promoTag: {
    color: Colors.orange.primary,
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  promoTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  promoSub: {
    color: Colors.gray[400],
    fontSize: 12,
    marginTop: 4,
  },
  promoBtn: {
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start' as const,
    marginTop: 10,
  },
  promoBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  promoImage: {
    width: 140,
    height: '100%',
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: Colors.orange.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
