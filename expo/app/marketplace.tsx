import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Linking,
  Alert,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, Eye, MessageCircle, Phone, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSaleCars } from '@/lib/queries/cars';
import { useCreateLead } from '@/lib/queries/dealer';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import { SaleCar } from '@/types/car';

const CONDITIONS = ['All', 'New', 'Foreign Used', 'Locally Used'];
const BRANDS = ['All', 'Toyota', 'Mercedes', 'BMW', 'Honda', 'Hyundai', 'Range Rover'];
// listContent has 20px padding on each side and listingCard has no
// horizontal margin, so this is the card's actual on-screen width before
// the real onLayout measurement comes in — avoids a 0-width flash of the
// first image carousel frame.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_IMAGE_WIDTH = SCREEN_WIDTH - 40;
// Taller than a flat 200px so a cover-cropped photo still shows most of
// the car (roofline to wheels) instead of just a close-up of the front end.
const LISTING_IMAGE_HEIGHT = Math.round(DEFAULT_CARD_IMAGE_WIDTH * 0.72);

function SaleListingCard({ car }: { car: SaleCar }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const createLead = useCreateLead();
  const getOrCreateConversation = useGetOrCreateConversation();
  const images = car.images.length > 0 ? car.images : [car.image];
  const [imageIndex, setImageIndex] = useState(0);
  const [imageWidth, setImageWidth] = useState(DEFAULT_CARD_IMAGE_WIDTH);
  const imageScrollRef = useRef<ScrollView>(null);

  const openGallery = useCallback((index: number) => {
    router.push({ pathname: '/image-gallery', params: { carId: car.id, index: String(index), type: 'sale_car' } });
  }, [car.id, router]);

  const handleImageScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setImageIndex(Math.round(e.nativeEvent.contentOffset.x / imageWidth));
  }, [imageWidth]);

  const recordLead = useCallback((message: string) => {
    if (!currentUser) return;
    createLead.mutate({
      saleCarId: car.id,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      carModel: `${car.brand} ${car.model}`,
      message,
    });
  }, [car, currentUser, createLead]);

  const handleMessage = useCallback(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!car.dealerId) return;
    const msg = `Hi, I'm interested in the ${car.brand} ${car.model} (${car.year}) listed for GH₵${car.salePrice.toLocaleString()} on GoCar Hub.`;
    recordLead(msg);
    getOrCreateConversation.mutate(
      { otherUserId: car.dealerId, contextType: 'sale_car', contextId: car.id, contextLabel: `${car.brand} ${car.model}` },
      {
        onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
        onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [car, currentUser, recordLead, getOrCreateConversation, router]);

  const handleCall = useCallback(() => {
    recordLead('Called via GoCar Hub');
    void Linking.openURL(`tel:${car.dealerPhone}`);
  }, [car, recordLead]);

  return (
    <View style={styles.listingCard}>
      <View style={styles.listingImageWrap} onLayout={(e) => setImageWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={imageScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleImageScrollEnd}
          style={styles.listingImageScroll}
        >
          {images.map((img, idx) => (
            <Pressable
              key={idx}
              onPress={() => openGallery(idx)}
              testID={`sale-car-image-${car.id}-${idx}`}
              style={{ width: imageWidth, height: LISTING_IMAGE_HEIGHT }}
            >
              <Image source={{ uri: img }} style={styles.listingImage} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
        {car.isFeatured && (
          <View style={styles.featuredBadge}>
            <Sparkles size={10} color={Colors.white} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{car.condition}</Text>
        </View>
        {images.length > 1 && (
          <View style={styles.imageDotsRow}>
            {images.map((_, idx) => (
              <View key={idx} style={[styles.imageDot, idx === imageIndex && styles.imageDotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.listingInfo}>
        <View style={styles.listingHeader}>
          <View style={styles.listingNameWrap}>
            <Text style={styles.listingBrand}>{car.brand}</Text>
            <Text style={styles.listingModel} numberOfLines={1}>{car.model}</Text>
          </View>
          <View style={styles.viewsBadge}>
            <Eye size={12} color={Colors.gray[500]} />
            <Text style={styles.viewsText}>{car.views}</Text>
          </View>
        </View>

        <View style={styles.listingDetails}>
          <Text style={styles.detailChip}>{car.year}</Text>
          <Text style={styles.detailDot}>·</Text>
          <Text style={styles.detailChip}>{(car.mileage / 1000).toFixed(0)}k km</Text>
          <Text style={styles.detailDot}>·</Text>
          <Text style={styles.detailChip}>{car.transmission}</Text>
          <Text style={styles.detailDot}>·</Text>
          <Text style={styles.detailChip}>{car.fuelType}</Text>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={12} color={Colors.gray[500]} />
          <Text style={styles.locationText}>{car.location}</Text>
        </View>

        <View style={styles.listingBottom}>
          <View style={styles.priceWrap}>
            <Text style={styles.currency}>GH₵</Text>
            <Text style={styles.salePrice}>{car.salePrice.toLocaleString()}</Text>
          </View>

          <View style={styles.actionBtns}>
            <Pressable style={styles.messageBtn} onPress={handleMessage} testID={`sale-car-message-${car.id}`}>
              <MessageCircle size={16} color={Colors.white} />
            </Pressable>
            <Pressable style={styles.callBtn} onPress={handleCall}>
              <Phone size={16} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.dealerRow}>
          <Image source={{ uri: car.dealerAvatar }} style={styles.dealerAvatar} contentFit="cover" />
          <Text style={styles.dealerName}>{car.dealerName}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const { data: saleCars = [] } = useSaleCars();

  const filteredCars = useMemo(() => {
    return saleCars.filter((car) => {
      const matchQuery = query === '' ||
        car.brand.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase());
      const matchCondition = selectedCondition === 'All' || car.condition === selectedCondition;
      const matchBrand = selectedBrand === 'All' || car.brand === selectedBrand;
      return matchQuery && matchCondition && matchBrand;
    });
  }, [saleCars, query, selectedCondition, selectedBrand]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cars for sale..."
              placeholderTextColor={Colors.gray[400]}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color={showFilters ? Colors.white : Colors.orange.primary} />
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.filtersWrap}>
            <Text style={styles.filterLabel}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CONDITIONS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.chip, selectedCondition === c && styles.chipActive]}
                    onPress={() => setSelectedCondition(c)}
                  >
                    <Text style={[styles.chipText, selectedCondition === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Text style={[styles.filterLabel, { marginTop: 10 }]}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {BRANDS.map((b) => (
                  <Pressable
                    key={b}
                    style={[styles.chip, selectedBrand === b && styles.chipActive]}
                    onPress={() => setSelectedBrand(b)}
                  >
                    <Text style={[styles.chipText, selectedBrand === b && styles.chipTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SaleListingCard car={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: getNavBarClearance(insets.bottom) }]}
        ListHeaderComponent={
          <Text style={styles.resultsText}>{filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''} for sale</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Search size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No cars found</Text>
          </View>
        }
      />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  searchRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.gray[100],
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orange.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterBtnActive: {
    backgroundColor: Colors.orange.primary,
  },
  filtersWrap: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gray[700],
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  chipActive: {
    backgroundColor: Colors.orange.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.gray[700],
  },
  chipTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gray[600],
    marginBottom: 14,
  },
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  listingImageWrap: {
    width: '100%',
    height: LISTING_IMAGE_HEIGHT,
    position: 'relative' as const,
  },
  listingImageScroll: {
    height: LISTING_IMAGE_HEIGHT,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  imageDotsRow: {
    position: 'absolute' as const,
    bottom: 10,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    gap: 5,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageDotActive: {
    backgroundColor: Colors.white,
    width: 14,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 10,
    left: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  featuredText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  conditionBadge: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  listingInfo: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  listingNameWrap: {
    flex: 1,
  },
  listingBrand: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  listingModel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  viewsBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  listingDetails: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 8,
  },
  detailChip: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  detailDot: {
    color: Colors.gray[400],
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  listingBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  priceWrap: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  currency: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  salePrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gray[900],
    marginLeft: 2,
  },
  actionBtns: {
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
  dealerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  dealerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dealerName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[700],
  },
  emptyWrap: {
    alignItems: 'center' as const,
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
});
