import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { useChat } from '@/features/chat/useChat';
import type { ChatMessage } from '@/features/chat/chatStore';
import { useAuthStore } from '@/features/auth/authStore';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { ScreenHeader, Avatar, ActionSheet } from '@/components/ui';
import { Phone, Video, Trash, Edit } from '@/components/ui/Icons';
import { deleteMessage as deleteMessageApi } from '@/features/chat/chatApi';

function formatDateSeparator(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    conversationId: string;
    recipientId: string;
    recipientPubKey: string;
    recipientName: string;
  }>();

  const currentUser = useAuthStore((s) => s.user);
  const flashListRef = useRef<FlashList<ChatMessage>>(null);
  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessage | null>(null);

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

  const handleDeleteMessage = useCallback(async (msg: ChatMessage) => {
    const id = msg._id || msg.tempId;
    if (!id) return;
    try {
      await deleteMessageApi(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // silent
    }
  }, []);

  const renderItem = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isMine = item.senderId === currentUser?.id || item.senderId === 'me';
    const prevItem = messages[index + 1];
    const showDateSeparator = !prevItem ||
      new Date(prevItem.serverTimestamp || prevItem.clientTimestamp).toDateString() !==
      new Date(item.serverTimestamp || item.clientTimestamp).toDateString();

    return (
      <View>
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
            <View style={{ backgroundColor: colors.secondaryBackground, borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 4 }}>
              <Text style={{ ...typography.micro, color: colors.textSecondary }}>
                {formatDateSeparator(item.serverTimestamp || item.clientTimestamp)}
              </Text>
            </View>
          </View>
        )}
        <MessageBubble
          message={item}
          isMine={isMine}
          onRetry={
            item.optimisticStatus === 'failed'
              ? () => retryMessage(item._id || item.tempId)
              : undefined
          }
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setContextMenuMsg(item);
          }}
        />
      </View>
    );
  }, [currentUser?.id, retryMessage, messages, colors, typography]);

  const subtitle = isTyping ? 'écrit...' : undefined;

  return (
    <SafeScreen edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScreenHeader
          title={params.recipientName || 'Conversation'}
          subtitle={subtitle}
          onBack={() => router.back()}
          rightActions={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push({ pathname: '/(main)/call/audio', params: { recipientName: params.recipientName, recipientId: params.recipientId } })}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Phone size={20} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/(main)/call/video', params: { recipientName: params.recipientName, recipientId: params.recipientId } })}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Video size={20} color={colors.textPrimary} />
              </Pressable>
              <Avatar
                name={params.recipientName || '?'}
                size={36}
                avatarUrl={undefined}
                online={isTyping}
              />
            </View>
          }
        />

        <FlashList
          ref={flashListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.tempId || ''}
          renderItem={renderItem}
          inverted
          onEndReached={() => hasMore && fetchNextPage()}
          onEndReachedThreshold={0.3}
          estimatedItemSize={60}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <ActivityIndicator color={colors.textSecondary} size="small" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        />

        {isTyping && <TypingIndicator />}

        <MessageInput
          onSend={sendText}
          onTypingStart={sendTypingStart}
          onTypingStop={sendTypingStop}
        />

        <ActionSheet
          visible={contextMenuMsg !== null}
          onClose={() => setContextMenuMsg(null)}
          title="Actions"
          actions={[
            {
              label: 'Répondre',
              icon: <Edit size={20} color={colors.textPrimary} />,
              onPress: () => {},
            },
            {
              label: 'Supprimer',
              icon: <Trash size={20} color={colors.danger} />,
              onPress: () => { if (contextMenuMsg) handleDeleteMessage(contextMenuMsg); },
              destructive: true,
            },
          ]}
        />
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
