import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { Eye, Users, TrendingUp, Tag, MessageCircle, CheckCircle2, Clock, XCircle, Plus, Car, Phone, Pencil, Search, Trash2, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMyDealerListings, useMyLeads, useSetListingSold, useDeleteSaleCar } from '@/lib/queries/dealer';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { useInitiateFeaturedPayment } from '@/lib/queries/featured';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import TipBanner from '@/components/TipBanner';
import type { Lead } from '@/types/car';

// Marker URL for openAuthSessionAsync to watch for — see payment-bridge.tsx.
const PAYMENT_RETURN_SCHEME_URL = 'gocarhub://payment-return';

const LISTING_STATUS: Record<string, { bg: string; text: string }> = {
  active: { bg: Colors.success + '20', text: Colors.success },
  sold: { bg: Colors.gray[200], text: Colors.gray[600] },
  draft: { bg: Colors.warning + '20', text: Colors.warning },
};

const LEAD_STATUS_ICON: Record<string, React.ReactNode> = {
  new: <Clock size={14} color={Colors.info} />,
  contacted: <MessageCircle size={14} color={Colors.warning} />,
  converted: <CheckCircle2 size={14} color={Colors.success} />,
  lost: <XCircle size={14} color={Colors.error} />,
};

export default function DealerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: listings = [] } = useMyDealerListings();
  const { data: leads = [] } = useMyLeads();
  const getOrCreateConversation = useGetOrCreateConversation();
  const setListingSold = useSetListingSold();
  const deleteSaleCar = useDeleteSaleCar();
  const initiateFeaturedPayment = useInitiateFeaturedPayment();
  const queryClient = useQueryClient();
  const [inventoryQuery, setInventoryQuery] = useState('');

  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);
  const totalLeads = listings.reduce((acc, l) => acc + l.leads, 0);
  const activeListings = listings.filter(l => l.status === 'active').length;

  const filteredListings = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) => l.car.brand.toLowerCase().includes(q) || l.car.model.toLowerCase().includes(q)
    );
  }, [listings, inventoryQuery]);

  const handleToggleSold = useCallback((listingId: string, isSold: boolean) => {
    setListingSold.mutate(
      { listingId, isSold },
      { onError: (err) => Alert.alert('Could not update', getErrorMessage(err, 'Please try again.')) }
    );
  }, [setListingSold]);

  const handleDeleteListing = useCallback((saleCarId: string, label: string, leadCount: number) => {
    const message =
      leadCount > 0
        ? `Remove ${label}? This listing has ${leadCount} lead${leadCount === 1 ? '' : 's'} — deleting it removes that inquiry history too. This can't be undone.`
        : `Remove ${label} from your listings? This can't be undone.`;
    Alert.alert('Delete Listing', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSaleCar.mutate(saleCarId, {
            onError: (err) => Alert.alert('Could not delete', getErrorMessage(err, 'Please try again.')),
          });
        },
      },
    ]);
  }, [deleteSaleCar]);

  // openAuthSessionAsync watches for a redirect back to
  // PAYMENT_RETURN_SCHEME_URL and resolves as soon as it happens — see
  // payment-bridge.tsx for why that has to be our own gocarhub:// scheme
  // rather than the https returnUrl the edge function told Hubtel to use.
  const handleFeatureListing = useCallback((saleCarId: string, placement: 'marketplace' | 'home', label: string) => {
    initiateFeaturedPayment.mutate(
      { targetType: 'sale_car', targetId: saleCarId, placement },
      {
        onSuccess: async (data) => {
          if (Platform.OS === 'web') {
            window.open(data.checkoutUrl, '_blank');
            return;
          }
          const result = await WebBrowser.openAuthSessionAsync(data.checkoutUrl, PAYMENT_RETURN_SCHEME_URL);
          if (result.type === 'success') {
            const cancelled = result.url.includes('featured=cancelled');
            void queryClient.invalidateQueries({ queryKey: ['my-dealer-listings'] });
            void queryClient.invalidateQueries({ queryKey: ['sale_cars'] });
            setTimeout(() => {
              void queryClient.invalidateQueries({ queryKey: ['my-dealer-listings'] });
              void queryClient.invalidateQueries({ queryKey: ['sale_cars'] });
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

  const handleLeadMessage = useCallback((lead: Lead) => {
    if (!lead.customerId) return;
    getOrCreateConversation.mutate(
      { otherUserId: lead.customerId, contextType: 'sale_car', contextLabel: lead.carModel },
      {
        onSuccess: (conv) => router.push({ pathname: '/chat', params: { id: conv.id } }),
        onError: (err) => Alert.alert('Could not start chat', getErrorMessage(err, 'Please try again.')),
      }
    );
  }, [getOrCreateConversation, router]);

  const handleLeadCall = useCallback((lead: Lead) => {
    void Linking.openURL(`tel:${lead.customerPhone}`);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <TipBanner
          id="dealer-dashboard-howto"
          text="List a car for sale to start getting leads. When a buyer reaches out, use Message or Call to follow up directly."
          testID="dealer-dashboard-tip-banner"
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Eye size={20} color={Colors.info} />
            <Text style={styles.statValue}>{totalViews.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color={Colors.success} />
            <Text style={styles.statValue}>{totalLeads}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={styles.statCard}>
            <Tag size={20} color={Colors.orange.primary} />
            <Text style={styles.statValue}>{activeListings}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.listingsHeader}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          <Pressable style={styles.addCarBtn} onPress={() => router.push('/add-sale-car')} testID="add-sale-car-btn">
            <Plus size={16} color={Colors.white} />
            <Text style={styles.addCarBtnText}>Add Car</Text>
          </Pressable>
        </View>

        {listings.length > 0 && (
          <View style={styles.inventorySearchWrap}>
            <Search size={16} color={Colors.gray[400]} />
            <TextInput
              style={styles.inventorySearchInput}
              placeholder="Search your listings by brand or model..."
              placeholderTextColor={Colors.gray[400]}
              value={inventoryQuery}
              onChangeText={setInventoryQuery}
              testID="dealer-inventory-search"
            />
          </View>
        )}

        {listings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Car size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>You haven&apos;t listed any cars for sale yet</Text>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Search size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No listings match &quot;{inventoryQuery}&quot;</Text>
          </View>
        ) : (
          filteredListings.map((listing) => {
            const statusConfig = LISTING_STATUS[listing.status] ?? LISTING_STATUS.active;
            const isSold = listing.status === 'sold';
            return (
              <View key={listing.id} style={styles.listingCard}>
                <Pressable
                  style={styles.listingCardMain}
                  onPress={() => router.push({ pathname: '/add-sale-car', params: { id: listing.car.id } })}
                  testID={`edit-listing-${listing.car.id}`}
                >
                  <Image source={{ uri: listing.car.image }} style={styles.listingImage} contentFit="cover" />
                  <View style={styles.listingInfo}>
                    <View style={styles.listingHeader}>
                      <View style={styles.listingNameWrap}>
                        <Text style={styles.listingBrand}>{listing.car.brand}</Text>
                        <Text style={styles.listingModel} numberOfLines={1}>{listing.car.model}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>{listing.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.askingPrice}>GH₵{listing.askingPrice.toLocaleString()}</Text>
                    <View style={styles.listingStats}>
                      <View style={styles.listingStatItem}>
                        <Eye size={12} color={Colors.gray[500]} />
                        <Text style={styles.listingStatText}>{listing.views}</Text>
                      </View>
                      <View style={styles.listingStatItem}>
                        <Users size={12} color={Colors.gray[500]} />
                        <Text style={styles.listingStatText}>{listing.leads} leads</Text>
                      </View>
                      {listing.listingType === 'featured' && (
                        <View style={styles.featuredTag}>
                          <TrendingUp size={10} color={Colors.orange.primary} />
                          <Text style={styles.featuredTagText}>Featured</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.editIconWrap}>
                    <Pencil size={14} color={Colors.gray[400]} />
                  </View>
                </Pressable>
                <View style={styles.listingActionsRow}>
                  <View style={styles.availabilityToggle}>
                    <Text style={styles.availabilityLabel}>{isSold ? 'Sold' : 'Mark as sold'}</Text>
                    <Switch
                      value={isSold}
                      onValueChange={(next) => handleToggleSold(listing.id, next)}
                      trackColor={{ false: Colors.gray[300], true: Colors.gray[500] }}
                      thumbColor={isSold ? Colors.gray[700] : Colors.gray[100]}
                      testID={`sold-switch-${listing.id}`}
                    />
                  </View>
                  <Pressable
                    style={styles.deleteVehicleBtn}
                    onPress={() => handleDeleteListing(listing.car.id, `${listing.car.brand} ${listing.car.model}`, listing.leads)}
                    testID={`delete-listing-${listing.car.id}`}
                  >
                    <Trash2 size={14} color={Colors.error} />
                    <Text style={styles.deleteVehicleText}>Delete</Text>
                  </Pressable>
                </View>
                <View style={styles.featureRow}>
                  {listing.car.isFeatured ? (
                    <View style={styles.featuredBadgeSmall}>
                      <CheckCircle2 size={11} color={Colors.white} />
                      <Text style={styles.featuredBadgeSmallText}>Featured Carousel</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.featureBtn}
                      onPress={() => handleFeatureListing(listing.car.id, 'marketplace', `${listing.car.brand} ${listing.car.model}`)}
                      testID={`feature-marketplace-${listing.car.id}`}
                    >
                      <Sparkles size={12} color={Colors.orange.primary} />
                      <Text style={styles.featureBtnText}>Boost Views · Featured Carousel · GH₵300/mo</Text>
                    </Pressable>
                  )}
                  {listing.car.isHomeFeatured ? (
                    <View style={styles.featuredBadgeSmall}>
                      <CheckCircle2 size={11} color={Colors.white} />
                      <Text style={styles.featuredBadgeSmallText}>Marketplace Carousel</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.featureBtn}
                      onPress={() => handleFeatureListing(listing.car.id, 'home', `${listing.car.brand} ${listing.car.model}`)}
                      testID={`feature-home-${listing.car.id}`}
                    >
                      <Sparkles size={12} color={Colors.orange.primary} />
                      <Text style={styles.featureBtnText}>Boost Views · Marketplace Carousel · GH₵250/mo</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Recent Leads</Text>

        {leads.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Users size={32} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No leads yet</Text>
          </View>
        ) : (
          leads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.leadHeader}>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{lead.customerName}</Text>
                  <Text style={styles.leadCar}>{lead.carModel}</Text>
                </View>
                <View style={styles.leadStatusWrap}>
                  {LEAD_STATUS_ICON[lead.status]}
                  <Text style={styles.leadStatus}>{lead.status}</Text>
                </View>
              </View>
              <Text style={styles.leadMessage} numberOfLines={2}>{lead.message}</Text>
              <View style={styles.leadFooter}>
                <Text style={styles.leadDate}>{lead.createdAt}</Text>
                <View style={styles.leadActions}>
                  {lead.customerId ? (
                    <Pressable style={styles.leadMessageBtn} onPress={() => handleLeadMessage(lead)} testID={`lead-message-${lead.id}`}>
                      <MessageCircle size={14} color={Colors.white} />
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.leadCallBtn} onPress={() => handleLeadCall(lead)} testID={`lead-call-${lead.id}`}>
                    <Phone size={14} color={Colors.white} />
                  </Pressable>
                </View>
              </View>
            </View>
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
  content: {
    padding: 20,
    paddingBottom: 30,
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
  listingsHeader: {
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
    paddingVertical: 30,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  listingCard: {
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
  listingCardMain: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  listingActionsRow: {
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
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  featureBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.orange.faint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featureBtnText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.orange.primary,
  },
  featuredBadgeSmall: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featuredBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
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
  listingImage: {
    width: 110,
    height: 110,
  },
  listingInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center' as const,
  },
  listingHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  listingNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  listingBrand: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  listingModel: {
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
    textTransform: 'capitalize' as const,
  },
  askingPrice: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.orange.primary,
    marginTop: 4,
  },
  listingStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginTop: 6,
  },
  listingStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  listingStatText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  featuredTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.orange.faint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredTagText: {
    fontSize: 10,
    color: Colors.orange.primary,
    fontWeight: '700' as const,
  },
  leadCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 6,
  },
  leadInfo: {},
  leadName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  leadCar: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 1,
  },
  leadStatusWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  leadStatus: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gray[600],
    textTransform: 'capitalize' as const,
  },
  leadMessage: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  leadDate: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  leadFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 6,
  },
  leadActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  leadMessageBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.purple.medium,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  leadCallBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.info,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
