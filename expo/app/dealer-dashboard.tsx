import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, Users, TrendingUp, Tag, MessageCircle, CheckCircle2, Clock, XCircle, Plus, Car, Phone, Pencil } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMyDealerListings, useMyLeads } from '@/lib/queries/dealer';
import { useGetOrCreateConversation } from '@/lib/queries/chat';
import { getErrorMessage } from '@/lib/errors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import type { Lead } from '@/types/car';

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

  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);
  const totalLeads = listings.reduce((acc, l) => acc + l.leads, 0);
  const activeListings = listings.filter(l => l.status === 'active').length;

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

        {listings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Car size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>You haven&apos;t listed any cars for sale yet</Text>
          </View>
        ) : (
          listings.map((listing) => {
            const statusConfig = LISTING_STATUS[listing.status] ?? LISTING_STATUS.active;
            return (
              <Pressable
                key={listing.id}
                style={styles.listingCard}
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
