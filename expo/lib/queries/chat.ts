import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { ConversationRow, ChatMessageRow } from '@/types/database';

export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUserName: string;
  contextLabel: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  isMine: boolean;
}

type ConversationWithProfiles = ConversationRow & {
  customer: { name: string } | null;
  counterpart: { name: string } | null;
  chat_messages: { is_read: boolean; sender_id: string }[];
};

export function useConversations() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const query = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async (): Promise<ConversationSummary[]> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, customer:profiles!customer_id(name), counterpart:profiles!counterpart_id(name), chat_messages(is_read, sender_id)')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      if (error) throw error;

      return (data as unknown as ConversationWithProfiles[]).map((row) => {
        const isCustomer = row.customer_id === userId;
        return {
          id: row.id,
          otherUserId: isCustomer ? row.counterpart_id : row.customer_id,
          otherUserName: (isCustomer ? row.counterpart?.name : row.customer?.name) ?? 'User',
          contextLabel: row.context_label,
          lastMessageAt: row.last_message_at,
          unreadCount: row.chat_messages.filter((m) => !m.is_read && m.sender_id !== userId).length,
        };
      });
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    // Suffixed with a random id: React (StrictMode, fast remounts) can run
    // this effect's setup before the previous cleanup's removeChannel call
    // has finished, and supabase-js reuses a channel by topic name — adding
    // .on() to an already-subscribed channel then throws. A unique topic
    // per mount avoids the collision entirely.
    const channel = supabase
      .channel(`conversations-list-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        void query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void query.refetch();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return query;
}

type SupportConversationWithCustomer = ConversationRow & {
  customer: { name: string } | null;
  chat_messages: { is_read: boolean; sender_id: string }[];
};

// Admin-facing: every support enquiry, from any admin's point of view —
// relies on the is_admin() RLS bypass on conversations/chat_messages rather
// than a per-viewer filter, since any admin can pick up any thread.
export function useSupportConversations() {
  const query = useQuery({
    queryKey: ['admin-support-conversations'],
    queryFn: async (): Promise<ConversationSummary[]> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, customer:profiles!customer_id(name), chat_messages(is_read, sender_id)')
        .eq('context_type', 'support')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as unknown as SupportConversationWithCustomer[]).map((row) => ({
        id: row.id,
        otherUserId: row.customer_id,
        otherUserName: row.customer?.name ?? 'User',
        contextLabel: row.context_label,
        lastMessageAt: row.last_message_at,
        unreadCount: row.chat_messages.filter((m) => !m.is_read && m.sender_id === row.customer_id).length,
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`support-conversations-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        void query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void query.refetch();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return query;
}

export function useUnreadConversationsCount() {
  const { data: conversations = [] } = useConversations();
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export function useMessages(conversationId: string | undefined) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as ChatMessageRow[]).map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        body: row.body,
        isRead: row.is_read,
        createdAt: row.created_at,
        isMine: row.sender_id === userId,
      }));
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-messages-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { otherUserId: string; contextType?: string; contextId?: string; contextLabel?: string }) => {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_other_user_id: input.otherUserId,
        p_context_type: input.contextType ?? null,
        p_context_id: input.contextId ?? null,
        p_context_label: input.contextLabel ?? null,
      });
      if (error) throw error;
      return data as ConversationRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartSupportConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('start_support_conversation');
      if (error) throw error;
      return data as ConversationRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Starts (or reuses) the caller's support thread and sends one message in
// it, for one-shot "contact support" forms that don't have a conversation
// screen open yet — returns the conversation so the caller can navigate in.
export function useSendSupportEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data: conv, error: convError } = await supabase.rpc('start_support_conversation');
      if (convError) throw convError;
      const { error: msgError } = await supabase.rpc('send_message', {
        p_conversation_id: (conv as ConversationRow).id,
        p_body: body,
      });
      if (msgError) throw msgError;
      return conv as ConversationRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId as string,
        p_body: body,
      });
      if (error) throw error;
      return data as ChatMessageRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId as string });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
