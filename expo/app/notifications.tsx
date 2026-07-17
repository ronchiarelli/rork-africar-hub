import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CalendarDays, CreditCard, Tag, ShieldCheck, Settings } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/lib/queries/notifications';
import { getNavBarClearance } from '@/components/BottomNavBar';
import type { AppNotification } from '@/types/car';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  booking: <CalendarDays size={18} color={Colors.info} />,
  payment: <CreditCard size={18} color={Colors.success} />,
  promo: <Tag size={18} color={Colors.orange.primary} />,
  kyc: <ShieldCheck size={18} color={Colors.warning} />,
  system: <Settings size={18} color={Colors.gray[600]} />,
};

const TYPE_BG: Record<string, string> = {
  booking: Colors.info + '15',
  payment: Colors.success + '15',
  promo: Colors.orange.faint,
  kyc: Colors.warning + '15',
  system: Colors.gray[100],
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: notifications = [] } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  const markAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const handlePressNotification = useCallback((notif: AppNotification) => {
    if (!notif.isRead) markReadMutation.mutate(notif.id);
    if (notif.actionRoute) {
      router.push({ pathname: notif.actionRoute, params: notif.actionParams } as never);
    }
  }, [markReadMutation, router]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadText}>{unreadCount} unread</Text>
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        {notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Bell size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You&apos;re all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <Pressable
              key={notif.id}
              style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
              onPress={() => handlePressNotification(notif)}
              testID={`notification-${notif.id}`}
            >
              <View style={[styles.iconWrap, { backgroundColor: TYPE_BG[notif.type] ?? Colors.gray[100] }]}>
                {TYPE_ICONS[notif.type] ?? <Bell size={18} color={Colors.gray[500]} />}
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                  <Text style={styles.notifTime}>{formatTime(notif.timestamp)}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
              </View>
              {!notif.isRead && <View style={styles.unreadDot} />}
            </Pressable>
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
  topBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  unreadText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gray[600],
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  notifCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
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
  notifCardUnread: {
    backgroundColor: Colors.orange.faint,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange.primary,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  notifMessage: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 100,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
});
