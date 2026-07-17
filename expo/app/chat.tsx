import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useConversations, useMessages, useSendMessage, useMarkConversationRead, type ChatMessage } from '@/lib/queries/chat';
import { getNavBarClearance } from '@/components/BottomNavBar';

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <View style={[styles.bubbleRow, message.isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, message.isMine && styles.bubbleTextMine]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, message.isMine && styles.bubbleTimeMine]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: conversations = [] } = useConversations();
  const conversation = conversations.find((c) => c.id === id);
  const { data: messages = [], isLoading } = useMessages(id);
  const sendMessage = useSendMessage(id);
  const markRead = useMarkConversationRead(id);

  useEffect(() => {
    if (id) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || !id) return;
    setDraft('');
    sendMessage.mutate(body, {
      onSuccess: () => listRef.current?.scrollToEnd({ animated: true }),
    });
  }, [draft, id, sendMessage]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: conversation?.otherUserName ?? 'Chat' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {conversation?.contextLabel && (
          <View style={styles.contextBar}>
            <Text style={styles.contextText} numberOfLines={1}>Re: {conversation.contextLabel}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.orange.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Say hello to start the conversation.</Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputRow, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray[400]}
            value={draft}
            onChangeText={setDraft}
            multiline
            testID="chat-input"
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sendMessage.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            testID="chat-send-btn"
          >
            <Send size={18} color={Colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  flex: {
    flex: 1,
  },
  contextBar: {
    backgroundColor: Colors.orange.faint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  contextText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.orange.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row' as const,
    marginBottom: 10,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end' as const,
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start' as const,
  },
  bubble: {
    maxWidth: '78%' as const,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: Colors.orange.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14,
    color: Colors.gray[900],
    lineHeight: 19,
  },
  bubbleTextMine: {
    color: Colors.white,
  },
  bubbleTime: {
    fontSize: 10,
    color: Colors.gray[400],
    marginTop: 4,
    alignSelf: 'flex-end' as const,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 10,
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.gray[900],
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
