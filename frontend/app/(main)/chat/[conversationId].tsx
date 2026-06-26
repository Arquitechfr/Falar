import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { useChat } from '@/features/chat/useChat';
import type { ChatMessage } from '@/features/chat/chatStore';
import { useAuthStore } from '@/features/auth/authStore';
import { theme } from '@/constants/theme';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId: string;
    recipientId: string;
    recipientPubKey: string;
    recipientName: string;
  }>();

  const currentUser = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const {
    messages,
    isTyping,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    sendText,
    retryMessage,
    sendTypingStart,
    sendTypingStop,
    markAsRead,
  } = useChat({
    conversationId: params.conversationId,
    recipientId: params.recipientId,
    recipientPubKey: params.recipientPubKey,
  });

  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.senderId !== currentUser?.id && m.status !== 'read')
      .map((m) => m._id);
    if (unreadIds.length > 0) markAsRead(unreadIds);
  }, [messages, currentUser?.id, markAsRead]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === currentUser?.id || item.senderId === 'me';
    return (
      <MessageBubble
        message={item}
        isMine={isMine}
        onRetry={
          item.optimisticStatus === 'failed'
            ? () => retryMessage(item._id || item.tempId)
            : undefined
        }
      />
    );
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <View className="flex-row items-center px-3 py-3 bg-surface">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-textPrimary text-lg">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-base" numberOfLines={1}>
              {params.recipientName || 'Conversation'}
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.tempId || ''}
          renderItem={renderItem}
          inverted
          onEndReached={() => hasMore && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={theme.textSecondary} className="py-4" />
            ) : null
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        {isTyping && <TypingIndicator />}

        <MessageInput
          onSend={sendText}
          onTypingStart={sendTypingStart}
          onTypingStop={sendTypingStop}
        />
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
