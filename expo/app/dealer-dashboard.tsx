import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Eye, Users, TrendingUp, Tag, MessageCircle, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockDealerListings, mockLeads } from '@/mocks/cars';

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
  const totalViews = mockDealerListings.reduce((acc, l) => acc + l.views, 0);
  const totalLeads = mockDealerListings.reduce((acc, l) => acc + l.leads, 0);
  const activeListings = mockDealerListings.filter(l => l.status === 'active').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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

        <Text style={styles.sectionTitle}>My Listings</Text>

        {mockDealerListings.map((listing) => {
          const statusConfig = LISTING_STATUS[listing.status] ?? LISTING_STATUS.active;
          return (
            <View key={listing.id} style={styles.listingCard}>
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
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Recent Leads</Text>

        {mockLeads.map((lead) => (
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
            <Text style={styles.leadDate}>{lead.createdAt}</Text>
          </View>
        ))}
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
  listingCard: {
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
    marginTop: 6,
  },
});
