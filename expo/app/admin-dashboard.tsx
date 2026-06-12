import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockAdminStats, mockAdminUsers } from '@/mocks/cars';

const TABS = ['Overview', 'Users', 'KYC'] as const;
type Tab = typeof TABS[number];

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
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab === 'Overview' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users size={20} color={Colors.info} />
                <Text style={styles.statValue}>{mockAdminStats.totalUsers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              <View style={styles.statCard}>
                <CalendarDays size={20} color={Colors.success} />
                <Text style={styles.statValue}>{mockAdminStats.totalBookings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <DollarSign size={20} color={Colors.orange.primary} />
                <Text style={styles.statValue}>GH₵{(mockAdminStats.totalRevenue / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Tag size={20} color={Colors.purple.medium} />
                <Text style={styles.statValue}>{mockAdminStats.activeListings}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
            </View>

            <View style={styles.growthCard}>
              <View style={styles.growthHeader}>
                <Text style={styles.growthTitle}>Monthly Growth</Text>
                <View style={styles.growthBadge}>
                  <TrendingUp size={14} color={Colors.success} />
                  <Text style={styles.growthValue}>+{mockAdminStats.monthlyGrowth}%</Text>
                </View>
              </View>
              <View style={styles.growthBar}>
                <View style={[styles.growthFill, { width: `${Math.min(mockAdminStats.monthlyGrowth * 5, 100)}%` }]} />
              </View>
            </View>

            <View style={styles.alertCard}>
              <ShieldCheck size={20} color={Colors.warning} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{mockAdminStats.pendingKYC} Pending KYC Reviews</Text>
                <Text style={styles.alertText}>Users waiting for identity verification</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Users' && (
          <>
            <Text style={styles.sectionTitle}>All Users ({mockAdminUsers.length})</Text>
            {mockAdminUsers.map((user) => {
              const statusConfig = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.active;
              return (
                <View key={user.id} style={styles.userCard}>
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
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'KYC' && (
          <>
            <Text style={styles.sectionTitle}>Pending KYC Approvals</Text>
            {mockAdminUsers.filter(u => u.status === 'pending_kyc').map((user) => (
              <View key={user.id} style={styles.kycCard}>
                <View style={styles.kycHeader}>
                  <Image source={{ uri: user.avatar }} style={styles.kycAvatar} contentFit="cover" />
                  <View style={styles.kycInfo}>
                    <Text style={styles.kycName}>{user.name}</Text>
                    <Text style={styles.kycEmail}>{user.email}</Text>
                    <Text style={styles.kycDate}>Joined: {user.joinDate}</Text>
                  </View>
                </View>
                <View style={styles.kycActions}>
                  <Pressable style={styles.approveBtn}>
                    <UserCheck size={16} color={Colors.white} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn}>
                    <UserX size={16} color={Colors.white} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {mockAdminUsers.filter(u => u.status === 'pending_kyc').length === 0 && (
              <View style={styles.emptyWrap}>
                <Clock size={40} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No pending KYC approvals</Text>
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
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
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
});
