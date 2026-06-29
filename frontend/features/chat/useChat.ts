import { useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getMessages, sendMessage as apiSendMessage, updateMessageStatus, type Message } from './chatApi';
import { useChatStore, type ChatMessage } from './chatStore';
import { encryptMessage, decryptMessage } from '@/features/crypto/encryption';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { getSocket } from '@/services/socket';

interface UseChatParams {
  conversationId: string;
  recipientId: string;
  recipientPubKey: string;
}

function toChatMessage(msg: Message, privateKey: Uint8Array | null, recipientPubKey: string): ChatMessage {
  let decryptedText = '[message illisible]';
  if (privateKey) {
    try {
      const text = decryptMessage(msg.encryptedPayload, msg.nonce, privateKey, recipientPubKey);
      if (text) decryptedText = text;
    } catch {
      // keep default
    }
  }
  return { ...msg, decryptedText };
}

export function useChat({ conversationId, recipientId, recipientPubKey }: UseChatParams) {
  const privateKey = useCryptoStore((s) => s.privateKey);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setMessages = useChatStore((s) => s.setMessages);
  const setTyping = useChatStore((s) => s.setTyping);
  const clear = useChatStore((s) => s.clear);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<{ messages: ChatMessage[] }>({
    messages: [],
  });

  cleanupRef.current = { messages };

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const data = await getMessages(conversationId, pageParam, 30);
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.messages[lastPage.messages.length - 1]?.serverTimestamp : undefined),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (query.data) {
      const allMessages = query.data.pages.flatMap((p) => p.messages);
      InteractionManager.runAfterInteractions(() => {
        const chatMessages = allMessages
          .map((m) => toChatMessage(m, privateKey, recipientPubKey))
          .reverse();
        setMessages(chatMessages);
      });
    }
  }, [query.data, privateKey, recipientPubKey, setMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      const chatMsg = toChatMessage(msg, privateKey, recipientPubKey);
      addMessage(chatMsg);
      socket.emit('message:delivered', { messageId: msg._id });
    };

    const onStatusUpdate = (data: { messageId: string; status: string }) => {
      updateMessage(data.messageId, { status: data.status as ChatMessage['status'] });
    };

    const onTypingStart = (data: { conversationId?: string }) => {
      if (data.conversationId === conversationId) setTyping(true);
    };
    const onTypingStop = (data: { conversationId?: string }) => {
      if (data.conversationId === conversationId) setTyping(false);
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:status', onStatusUpdate);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:status', onStatusUpdate);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [conversationId, privateKey, recipientPubKey, addMessage, updateMessage, setTyping]);

  useEffect(() => {
    return () => {
      const { messages: currentMessages } = cleanupRef.current;
      const socket = getSocket();
      const unreadMessages = currentMessages.filter(
        (m) => m.senderId !== 'me' && m.senderId !== currentUserId && m.status !== 'read',
      );
      if (socket && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          socket.emit('message:read', { messageId: msg._id });
        }
      }
      clear();
    };
  }, [clear, recipientId, currentUserId]);

  const sendText = useCallback(
    async (text: string) => {
      if (!text.trim() || !privateKey) return;

      const { encryptedPayload, nonce } = encryptMessage(text, privateKey, recipientPubKey);
      const tempId = `temp_${Date.now()}`;
      const clientTimestamp = new Date().toISOString();

      const optimisticMsg: ChatMessage = {
        _id: tempId,
        tempId,
        conversationId,
        senderId: 'me',
        recipientId,
        encryptedPayload,
        nonce,
        mediaUrl: '',
        status: 'sent',
        optimisticStatus: 'sending',
        clientTimestamp,
        serverTimestamp: clientTimestamp,
        createdAt: clientTimestamp,
        decryptedText: text,
      };

      addMessage(optimisticMsg);

      try {
        const result = await apiSendMessage({
          recipientId,
          encryptedPayload,
          nonce,
          clientTimestamp,
        });
        updateMessage(tempId, {
          _id: result.messageId,
          serverTimestamp: result.serverTimestamp,
          optimisticStatus: 'sent',
        });
      } catch {
        updateMessage(tempId, { optimisticStatus: 'failed' });
      }
    },
    [privateKey, recipientPubKey, recipientId, conversationId, addMessage, updateMessage],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m._id === messageId || m.tempId === messageId);
      if (!msg) return;

      updateMessage(messageId, { optimisticStatus: 'sending' });

      try {
        const result = await apiSendMessage({
          recipientId,
          encryptedPayload: msg.encryptedPayload,
          nonce: msg.nonce,
          clientTimestamp: msg.clientTimestamp,
        });
        updateMessage(messageId, {
          _id: result.messageId,
          serverTimestamp: result.serverTimestamp,
          optimisticStatus: 'sent',
        });
      } catch {
        updateMessage(messageId, { optimisticStatus: 'failed' });
      }
    },
    [messages, recipientId, updateMessage],
  );

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTypingStart = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing:start', { conversationId, recipientId });
      typingTimeoutRef.current = setTimeout(() => {
        const s = getSocket();
        if (s) s.emit('typing:stop', { conversationId, recipientId });
      }, 2000);
    }, 300);
  }, [conversationId, recipientId]);

  const sendTypingStop = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', { conversationId, recipientId });
  }, [conversationId, recipientId]);

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      InteractionManager.runAfterInteractions(() => {
        for (const id of messageIds) {
          updateMessageStatus(id, 'read').catch(() => {});
        }
      });
    },
    [],
  );

  return useMemo(
    () => ({
      messages,
      isTyping,
      hasMore: query.hasNextPage,
      fetchNextPage: query.fetchNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      sendText,
      retryMessage,
      sendTypingStart,
      sendTypingStop,
      markAsRead,
    }),
    [messages, isTyping, query.hasNextPage, query.fetchNextPage, query.isFetchingNextPage, sendText, retryMessage, sendTypingStart, sendTypingStop, markAsRead],
  );
}
