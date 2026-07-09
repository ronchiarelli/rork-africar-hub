import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  Heart,
  Bell,
  MessageSquare,
  Car,
  Store,
  LayoutDashboard,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useRequestRoleUpgrade } from '@/lib/queries/profile';
import { useUnreadConversationsCount } from '@/lib/queries/chat';
import { UserRole } from '@/types/car';

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  fleet_owner: 'Fleet Owner',
  dealership: 'Dealership',
  admin: 'Admin',
};

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
  color?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, currentRole, logout } = useAuth();
  const requestRoleUpgrade = useRequestRoleUpgrade(currentUser?.id);
  const unreadMessages = useUnreadConversationsCount();

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void logout() },
    ]);
  }, [logout]);

  const handleRequestRoleUpgrade = useCallback(() => {
    Alert.alert('Request Account Upgrade', 'What type of account would you like to apply for?', [
      {
        text: 'Fleet Owner',
        onPress: () => {
          requestRoleUpgrade.mutate('fleet_owner', {
            onSuccess: () => Alert.alert('Request Sent', 'An admin will review your fleet owner application.'),
            onError: () => Alert.alert('Error', 'Could not submit your request. Please try again.'),
          });
        },
      },
      {
        text: 'Dealership',
        onPress: () => {
          requestRoleUpgrade.mutate('dealership', {
            onSuccess: () => Alert.alert('Request Sent', 'An admin will review your dealership application.'),
            onError: () => Alert.alert('Error', 'Could not submit your request. Please try again.'),
          });
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [requestRoleUpgrade]);

  const menuItems: MenuItem[][] = [
    [
      { icon: <Heart size={20} color={Colors.orange.primary} />, label: 'My Favorites', route: '/favorites' },
      {
        icon: <MessageSquare size={20} color={Colors.purple.medium} />,
        label: 'Messages',
        route: '/messages',
        badge: unreadMessages > 0 ? String(unreadMessages) : undefined,
      },
      { icon: <Bell size={20} color={Colors.info} />, label: 'Notifications', route: '/notifications', badge: '3' },
      { icon: <ShieldCheck size={20} color={Colors.success} />, label: 'KYC Verification', route: '/kyc-verification' },
    ],
    ...(currentRole === 'fleet_owner' ? [[
      { icon: <Car size={20} color={Colors.purple.medium} />, label: 'Fleet Dashboard', route: '/fleet-dashboard' },
    ]] : []),
    ...(currentRole === 'dealership' ? [[
      { icon: <Store size={20} color={Colors.purple.medium} />, label: 'Dealer Dashboard', route: '/dealer-dashboard' },
    ]] : []),
    ...(currentRole === 'admin' ? [[
      { icon: <LayoutDashboard size={20} color={Colors.purple.medium} />, label: 'Admin Dashboard', route: '/admin-dashboard' },
    ]] : []),
    [
      ...(currentRole === 'customer' ? [{
        icon: <Users size={20} color={Colors.gray[600]} />, label: 'Request Account Upgrade', onPress: handleRequestRoleUpgrade,
      }] : []),
      { icon: <Settings size={20} color={Colors.gray[600]} />, label: 'Settings', route: '/settings' },
      { icon: <HelpCircle size={20} color={Colors.gray[600]} />, label: 'Help & Support', route: '/help-support' },
      ...(currentRole === 'fleet_owner' || currentRole === 'dealership' ? [{
        icon: <Wallet size={20} color={Colors.gray[600]} />, label: 'My Wallet', route: '/wallet',
      }] : []),
    ],
    [
      { icon: <LogOut size={20} color={Colors.error} />, label: 'Logout', onPress: handleLogout, color: Colors.error },
    ],
  ];

  if (!currentUser) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} contentFit="cover" />
            <View style={styles.verifiedBadge}>
              <Shield size={12} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{ROLE_LABELS[currentRole]}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.totalBookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser.verificationStatus === 'approved' ? '✓' : '○'}
              </Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.memberSince.split('-')[0]}</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>
        </View>

        {menuItems.map((group, groupIdx) => (
          <View key={groupIdx} style={styles.menuGroup}>
            {group.map((item, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
                onPress={() => {
                  if (item.onPress) item.onPress();
                  else if (item.route) router.push(item.route as never);
                }}
              >
                <View style={styles.menuLeft}>
                  {item.icon}
                  <Text style={[styles.menuLabel, item.color ? { color: item.color } : null]}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={16} color={Colors.gray[400]} />
                </View>
              </Pressable>
            ))}
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
    paddingBottom: 30,
  },
  profileHeader: {
    backgroundColor: Colors.purple.deep,
    alignItems: 'center' as const,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarWrap: {
    position: 'relative' as const,
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.orange.primary,
  },
  verifiedBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.purple.deep,
  },
  name: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  email: {
    fontSize: 13,
    color: Colors.gray[400],
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.orange.primary + '30',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: Colors.orange.primary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 20,
    gap: 24,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center' as const,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  menuPressed: {
    backgroundColor: Colors.gray[50],
  },
  menuLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.gray[800],
  },
  menuRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  menuBadge: {
    backgroundColor: Colors.orange.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
