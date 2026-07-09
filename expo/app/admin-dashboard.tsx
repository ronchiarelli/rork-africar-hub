import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Users,
  CalendarDays,
  DollarSign,
  Tag,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  ChevronRight,
  CreditCard,
  BarChart3,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePendingKycDocuments, useReviewKycDocument } from '@/lib/queries/kyc';
import { usePendingRoleApplications, useReviewRoleApplication } from '@/lib/queries/roleApplications';
import {
  usePlatformStats,
  useAllUsers,
  useAllSubscriptions,
  useExtendSubscription,
  useSetSubscriptionStatus,
  useSubscriptionRate,
  useSetSubscriptionRate,
  useMonthlyTrends,
  useTopCars,
} from '@/lib/queries/admin';
import { useAllBanners, useSetBannerActive, useDeleteBanner } from '@/lib/queries/banners';
import { getErrorMessage } from '@/lib/errors';

const TABS = ['Overview', 'Users', 'KYC', 'Roles', 'Banners', 'Subscriptions', 'Analytics'] as const;
type Tab = typeof TABS[number];

const SUB_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  trialing: { bg: Colors.info + '20', text: Colors.info, label: 'Trialing' },
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Active' },
  past_due: { bg: Colors.warning + '20', text: Colors.warning, label: 'Past Due' },
  cancelled: { bg: Colors.error + '20', text: Colors.error, label: 'Cancelled' },
};

const ROLE_COLORS: Record<string, string> = {
  customer: Colors.info,
  fleet_owner: Colors.purple.medium,
  dealership: Colors.orange.primary,
  admin: Colors.error,
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.success + '20', text: Colors.success, label: 'Active' },
  suspended: { bg: Colors.error + '20', text: Colors.error, label: 'Suspended' },
  pending_kyc: { bg: Colors.warning + '20', text: Colors.warning, label: 'Pending KYC' },
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const { data: pendingKyc = [] } = usePendingKycDocuments();
  const reviewKyc = useReviewKycDocument();
  const { data: pendingRoleApps = [] } = usePendingRoleApplications();
  const reviewRoleApp = useReviewRoleApplication();
  const { data: stats } = usePlatformStats();
  const { data: allUsers = [] } = useAllUsers();
  const { data: banners = [] } = useAllBanners();
  const setBannerActive = useSetBannerActive();
  const deleteBanner = useDeleteBanner();
  const { data: subscriptions = [] } = useAllSubscriptions();
  const extendSubscription = useExtendSubscription();
  const setSubscriptionStatus = useSetSubscriptionStatus();
  const { data: subscriptionRate } = useSubscriptionRate();
  const setSubscriptionRate = useSetSubscriptionRate();
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const { data: monthlyTrends = [] } = useMonthlyTrends();
  const { data: topCars = [] } = useTopCars();

  const handleKycDecision = (docId: string, decision: 'verified' | 'rejected') => {
    reviewKyc.mutate(
      { docId, decision },
      { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this document.')) }
    );
  };

  const handleRoleDecision = (userId: string, decision: 'approved' | 'rejected') => {
    reviewRoleApp.mutate(
      { userId, decision },
      { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this application.')) }
    );
  };

  const handleExtendSubscription = (userId: string) => {
    Alert.alert('Extend Subscription', 'Extend this subscription by how many days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '+7 days',
        onPress: () => extendSubscription.mutate({ userId, days: 7 }, { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not extend subscription.')) }),
      },
      {
        text: '+30 days',
        onPress: () => extendSubscription.mutate({ userId, days: 30 }, { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not extend subscription.')) }),
      },
    ]);
  };

  const handleStartEditRate = () => {
    setRateInput(String(subscriptionRate ?? ''));
    setIsEditingRate(true);
  };

  const handleSaveRate = () => {
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a positive number.');
      return;
    }
    Alert.alert('Update Subscription Rate', `Set the monthly rate to GH₵${rate} for all fleet owner and dealership accounts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          setSubscriptionRate.mutate(rate, {
            onSuccess: () => setIsEditingRate(false),
            onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update the subscription rate.')),
          });
        },
      },
    ]);
  };

  const handleSetSubscriptionStatus = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'cancelled' ? 'active' : 'cancelled';
    Alert.alert(
      nextStatus === 'cancelled' ? 'Cancel Subscription' : 'Reactivate Subscription',
      `Set this subscription to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: nextStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: () => {
            setSubscriptionStatus.mutate(
              { userId, status: nextStatus },
              { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update subscription status.')) }
            );
          },
        },
      ]
    );
  };

  const handleDeleteBanner = (bannerId: string) => {
    Alert.alert('Delete Banner', 'Are you sure you want to delete this banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBanner.mutate(bannerId, {
            onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not delete this banner.')),
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={styles.tabsRowContent}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab === 'Overview' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users size={20} color={Colors.info} />
                <Text style={styles.statValue}>{(stats?.totalUsers ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              <View style={styles.statCard}>
                <CalendarDays size={20} color={Colors.success} />
                <Text style={styles.statValue}>{(stats?.totalBookings ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <DollarSign size={20} color={Colors.orange.primary} />
                <Text style={styles.statValue}>GH₵{((stats?.totalSubscriptionRevenue ?? 0) / 1000).toFixed(1)}k</Text>
                <Text style={styles.statLabel}>Sub. Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Tag size={20} color={Colors.purple.medium} />
                <Text style={styles.statValue}>{(stats?.totalCars ?? 0) + (stats?.totalSaleCars ?? 0)}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
            </View>

            <View style={styles.growthCard}>
              <View style={styles.growthHeader}>
                <Text style={styles.growthTitle}>Monthly Growth</Text>
                <View style={styles.growthBadge}>
                  <TrendingUp size={14} color={(stats?.monthlyGrowth ?? 0) >= 0 ? Colors.success : Colors.error} />
                  <Text style={styles.growthValue}>{(stats?.monthlyGrowth ?? 0) >= 0 ? '+' : ''}{stats?.monthlyGrowth ?? 0}%</Text>
                </View>
              </View>
              <View style={styles.growthBar}>
                <View style={[styles.growthFill, { width: `${Math.min(Math.max(stats?.monthlyGrowth ?? 0, 0) * 5, 100)}%` }]} />
              </View>
            </View>

            <View style={styles.alertCard}>
              <ShieldCheck size={20} color={Colors.warning} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{pendingKyc.length} Pending KYC Reviews</Text>
                <Text style={styles.alertText}>Users waiting for identity verification</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Users' && (
          <>
            <Text style={styles.sectionTitle}>All Users ({allUsers.length})</Text>
            {allUsers.map((user) => {
              const statusConfig = user.isSuspended
                ? STATUS_CONFIG.suspended
                : user.verificationStatus === 'pending'
                  ? STATUS_CONFIG.pending_kyc
                  : STATUS_CONFIG.active;
              return (
                <Pressable
                  key={user.id}
                  style={styles.userCard}
                  onPress={() => router.push({ pathname: '/admin-user-detail', params: { id: user.id } } as never)}
                  testID={`user-row-${user.id}`}
                >
                  <Image source={{ uri: user.avatar }} style={styles.userAvatar} contentFit="cover" />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[user.role] ?? Colors.gray[500]) + '20' }]}>
                        <Text style={[styles.roleText, { color: ROLE_COLORS[user.role] ?? Colors.gray[500] }]}>{user.role.replace('_', ' ')}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.gray[300]} />
                </Pressable>
              );
            })}
          </>
        )}

        {activeTab === 'KYC' && (
          <>
            <Text style={styles.sectionTitle}>Pending KYC Approvals</Text>
            {pendingKyc.map((doc) => (
              <View key={doc.docId} style={styles.kycCard}>
                <View style={styles.kycHeader}>
                  <View style={styles.kycInfo}>
                    <Text style={styles.kycName}>{doc.userName}</Text>
                    <Text style={styles.kycEmail}>{doc.userEmail}</Text>
                    <Text style={styles.kycDate}>{doc.label} · Uploaded {doc.uploadedAt?.split('T')[0]}</Text>
                  </View>
                </View>
                <View style={styles.kycActions}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => handleKycDecision(doc.docId, 'verified')}
                    disabled={reviewKyc.isPending}
                  >
                    <UserCheck size={16} color={Colors.white} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => handleKycDecision(doc.docId, 'rejected')}
                    disabled={reviewKyc.isPending}
                  >
                    <UserX size={16} color={Colors.white} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {pendingKyc.length === 0 && (
              <View style={styles.emptyWrap}>
                <Clock size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No pending KYC approvals</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Roles' && (
          <>
            <Text style={styles.sectionTitle}>Pending Role Requests</Text>
            {pendingRoleApps.map((app) => (
              <View key={app.applicationId} style={styles.kycCard}>
                <View style={styles.kycHeader}>
                  <View style={styles.kycInfo}>
                    <Text style={styles.kycName}>{app.userName}</Text>
                    <Text style={styles.kycEmail}>{app.userEmail}</Text>
                    <Text style={styles.kycDate}>Requesting: {app.requestedRole.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.kycActions}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => handleRoleDecision(app.userId, 'approved')}
                    disabled={reviewRoleApp.isPending}
                  >
                    <UserCheck size={16} color={Colors.white} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => handleRoleDecision(app.userId, 'rejected')}
                    disabled={reviewRoleApp.isPending}
                  >
                    <UserX size={16} color={Colors.white} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {pendingRoleApps.length === 0 && (
              <View style={styles.emptyWrap}>
                <Clock size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No pending role requests</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Banners' && (
          <>
            <View style={styles.bannersHeader}>
              <Text style={styles.sectionTitle}>Home Screen Banners</Text>
              <Pressable style={styles.addBannerBtn} onPress={() => router.push('/add-banner')} testID="add-banner-btn">
                <Plus size={16} color={Colors.white} />
                <Text style={styles.addBannerBtnText}>New Banner</Text>
              </Pressable>
            </View>
            {banners.map((banner) => (
              <View key={banner.id} style={styles.bannerCard}>
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerThumb} contentFit="cover" />
                <View style={styles.bannerInfo}>
                  <Text style={styles.bannerTag}>{banner.tag}</Text>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                  <Text style={styles.bannerCta}>CTA: {banner.ctaLabel} → {banner.ctaRoute}</Text>
                  <View style={styles.bannerActionsRow}>
                    <Pressable
                      style={[styles.bannerStatusBadge, { backgroundColor: banner.isActive ? Colors.success + '20' : Colors.gray[200] }]}
                      onPress={() => setBannerActive.mutate({ id: banner.id, isActive: !banner.isActive })}
                      testID={`banner-toggle-${banner.id}`}
                    >
                      <Text style={[styles.bannerStatusText, { color: banner.isActive ? Colors.success : Colors.gray[600] }]}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.bannerIconBtn}
                      onPress={() => router.push({ pathname: '/add-banner', params: { id: banner.id } } as never)}
                      testID={`banner-edit-${banner.id}`}
                    >
                      <Pencil size={14} color={Colors.gray[600]} />
                    </Pressable>
                    <Pressable
                      style={styles.bannerIconBtn}
                      onPress={() => handleDeleteBanner(banner.id)}
                      testID={`banner-delete-${banner.id}`}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
            {banners.length === 0 && (
              <View style={styles.emptyWrap}>
                <Megaphone size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No banners yet</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Subscriptions' && (
          <>
            <View style={styles.rateCard}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Monthly Subscription Rate</Text>
                {isEditingRate ? (
                  <View style={styles.rateEditRow}>
                    <Text style={styles.rateCurrency}>GH₵</Text>
                    <TextInput
                      style={styles.rateInputField}
                      value={rateInput}
                      onChangeText={setRateInput}
                      keyboardType="numeric"
                      autoFocus
                      testID="admin-rate-input"
                    />
                  </View>
                ) : (
                  <Text style={styles.rateValue}>GH₵{subscriptionRate ?? '—'}<Text style={styles.ratePerMonth}>/month</Text></Text>
                )}
              </View>
              {isEditingRate ? (
                <View style={styles.rateActionsRow}>
                  <Pressable style={styles.rateCancelBtn} onPress={() => setIsEditingRate(false)} testID="admin-rate-cancel">
                    <Text style={styles.rateCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.rateSaveBtn} onPress={handleSaveRate} testID="admin-rate-save">
                    <Text style={styles.rateSaveText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.rateEditBtn} onPress={handleStartEditRate} testID="admin-rate-edit">
                  <Pencil size={14} color={Colors.orange.primary} />
                  <Text style={styles.rateEditText}>Edit</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionTitle}>All Subscriptions ({subscriptions.length})</Text>
            {subscriptions.map((sub) => {
              const config = SUB_STATUS_CONFIG[sub.status] ?? SUB_STATUS_CONFIG.trialing;
              return (
                <View key={sub.userId} style={styles.subCard}>
                  <View style={styles.subHeader}>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.userName}</Text>
                      <Text style={styles.subEmail}>{sub.userEmail} · {sub.role.replace('_', ' ')}</Text>
                      <Text style={styles.subMeta}>
                        {sub.currency}{sub.amount}/mo · Renews {sub.currentPeriodEnd?.split('T')[0] ?? '—'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
                    </View>
                  </View>
                  <View style={styles.subActionsRow}>
                    <Pressable style={styles.subActionBtn} onPress={() => handleExtendSubscription(sub.userId)} testID={`sub-extend-${sub.userId}`}>
                      <Text style={styles.subActionText}>Extend</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.subActionBtn, sub.status === 'cancelled' ? styles.subReactivateBtn : styles.subCancelBtn]}
                      onPress={() => handleSetSubscriptionStatus(sub.userId, sub.status)}
                      testID={`sub-toggle-${sub.userId}`}
                    >
                      <Text style={[styles.subActionText, { color: Colors.white }]}>
                        {sub.status === 'cancelled' ? 'Reactivate' : 'Cancel'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {subscriptions.length === 0 && (
              <View style={styles.emptyWrap}>
                <CreditCard size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No subscriptions yet</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Analytics' && (
          <>
            <Text style={styles.sectionTitle}>Trends (Last 6 Months)</Text>
            {(['bookings', 'newUsers', 'revenue'] as const).map((metric) => {
              const labels: Record<typeof metric, string> = { bookings: 'Bookings', newUsers: 'New Signups', revenue: 'Sub. Revenue (GH₵)' };
              const max = Math.max(1, ...monthlyTrends.map((t) => t[metric]));
              return (
                <View key={metric} style={styles.chartCard}>
                  <Text style={styles.chartTitle}>{labels[metric]}</Text>
                  <View style={styles.chartBars}>
                    {monthlyTrends.map((t) => (
                      <View key={t.monthStart} style={styles.chartBarCol}>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBarFill, { height: `${Math.max(4, (t[metric] / max) * 100)}%` }]} />
                        </View>
                        <Text style={styles.chartBarLabel}>{new Date(t.monthStart).toLocaleDateString('en-US', { month: 'short' })}</Text>
                        <Text style={styles.chartBarValue}>{Math.round(t[metric])}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>Top Cars by Bookings</Text>
            {topCars.map((car, idx) => (
              <View key={car.carId} style={styles.topCarCard}>
                <Text style={styles.topCarRank}>#{idx + 1}</Text>
                <Image source={{ uri: car.image }} style={styles.topCarImage} contentFit="cover" />
                <View style={styles.topCarInfo}>
                  <Text style={styles.topCarName}>{car.brand} {car.model}</Text>
                  <Text style={styles.topCarCount}>{car.bookingCount} booking{car.bookingCount === 1 ? '' : 's'}</Text>
                </View>
              </View>
            ))}
            {topCars.length === 0 && (
              <View style={styles.emptyWrap}>
                <BarChart3 size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            )}
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
  tabsRow: {
    flexGrow: 0,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  tabsRowContent: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
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
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '500' as const,
  },
  growthCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  growthHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  growthTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  growthBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  growthBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  growthFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  alertCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.warning + '15',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  alertText: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  userCard: {
    flexDirection: 'row' as const,
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
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  userEmail: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 1,
  },
  userMeta: {
    flexDirection: 'row' as const,
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  kycCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  kycHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  kycAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 12,
  },
  kycInfo: {
    flex: 1,
  },
  kycName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  kycEmail: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 1,
  },
  kycDate: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
  kycActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  bannersHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  addBannerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addBannerBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  bannerCard: {
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
  bannerThumb: {
    width: 90,
    height: 110,
  },
  bannerInfo: {
    flex: 1,
    padding: 12,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.orange.primary,
    textTransform: 'uppercase' as const,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginTop: 2,
  },
  bannerCta: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 4,
  },
  bannerActionsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 10,
  },
  bannerStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bannerStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  bannerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.gray[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  subCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rateCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rateInfo: { flex: 1 },
  rateLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.gray[500] },
  rateValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.gray[900], marginTop: 4 },
  ratePerMonth: { fontSize: 13, fontWeight: '600' as const, color: Colors.gray[500] },
  rateEditRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 6 },
  rateCurrency: { fontSize: 16, fontWeight: '700' as const, color: Colors.gray[700] },
  rateInputField: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    minWidth: 90,
  },
  rateEditBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.orange.primary + '15',
  },
  rateEditText: { fontSize: 13, fontWeight: '700' as const, color: Colors.orange.primary },
  rateActionsRow: { flexDirection: 'row' as const, gap: 8 },
  rateCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
  },
  rateCancelText: { fontSize: 13, fontWeight: '700' as const, color: Colors.gray[700] },
  rateSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.orange.primary,
  },
  rateSaveText: { fontSize: 13, fontWeight: '700' as const, color: Colors.white },
  subHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  subInfo: { flex: 1 },
  subName: { fontSize: 15, fontWeight: '700' as const, color: Colors.gray[900] },
  subEmail: { fontSize: 12, color: Colors.gray[500], marginTop: 2, textTransform: 'capitalize' as const },
  subMeta: { fontSize: 12, color: Colors.gray[600], marginTop: 4 },
  subActionsRow: { flexDirection: 'row' as const, gap: 8, marginTop: 12 },
  subActionBtn: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
  },
  subCancelBtn: { backgroundColor: Colors.error },
  subReactivateBtn: { backgroundColor: Colors.success },
  subActionText: { fontSize: 12, fontWeight: '700' as const, color: Colors.gray[700] },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900], marginBottom: 14 },
  chartBars: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    height: 120,
  },
  chartBarCol: { flex: 1, alignItems: 'center' as const, gap: 4 },
  chartBarTrack: {
    width: 18,
    height: 80,
    backgroundColor: Colors.gray[100],
    borderRadius: 6,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: Colors.orange.primary,
    borderRadius: 6,
  },
  chartBarLabel: { fontSize: 10, color: Colors.gray[500], marginTop: 2 },
  chartBarValue: { fontSize: 11, fontWeight: '700' as const, color: Colors.gray[900] },
  topCarCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topCarRank: { fontSize: 16, fontWeight: '800' as const, color: Colors.gray[400], width: 28 },
  topCarImage: { width: 50, height: 50, borderRadius: 10 },
  topCarInfo: { flex: 1 },
  topCarName: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900] },
  topCarCount: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
});
