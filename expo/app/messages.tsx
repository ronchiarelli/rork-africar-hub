import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useConversations } from '@/lib/queries/chat';
import { getNavBarClearance } from '@/components/BottomNavBar';

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '';
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

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: conversations = [] } = useConversations();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        {conversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MessageSquare size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Conversations with owners and dealers will show up here.</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <Pressable
              key={conv.id}
              style={styles.convCard}
              onPress={() => router.push({ pathname: '/chat', params: { id: conv.id } })}
              testID={`conversation-${conv.id}`}
            >
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarInitial}>{conv.otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <Text style={styles.convName} numberOfLines={1}>{conv.otherUserName}</Text>
                  <Text style={styles.convTime}>{formatTime(conv.lastMessageAt)}</Text>
                </View>
                {conv.contextLabel && (
                  <Text style={styles.convContext} numberOfLines={1}>Re: {conv.contextLabel}</Text>
                )}
              </View>
              {conv.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</Text>
                </View>
              )}
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
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  convCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple.faint,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.purple.medium,
  },
  convInfo: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  convName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  convContext: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  emptyWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 100,
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gray[700],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center' as const,
  },
});
