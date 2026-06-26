import { useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getMessages, sendMessage as apiSendMessage, updateMessageStatus, type Message } from './chatApi';
import { useChatStore, type ChatMessage } from './chatStore';
import { encryptMessage, decryptMessage } from '@/features/crypto/encryption';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
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
  const { messages, isTyping, addMessage, updateMessage, setMessages, setTyping, clear } = useChatStore();
  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<{ messages: ChatMessage[]; socket: ReturnType<typeof getSocket> }>({
    messages: [],
    socket: null,
  });

  cleanupRef.current = { messages, socket };

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
      const chatMessages = allMessages
        .map((m) => toChatMessage(m, privateKey, recipientPubKey))
        .reverse();
      setMessages(chatMessages);
    }
  }, [query.data, privateKey, recipientPubKey, setMessages]);

  useEffect(() => {
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

    const onTypingStart = () => setTyping(true);
    const onTypingStop = () => setTyping(false);

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
  }, [socket, conversationId, privateKey, recipientPubKey, addMessage, updateMessage, setTyping]);

  useEffect(() => {
    return () => {
      const { messages: currentMessages, socket: currentSocket } = cleanupRef.current;
      const unreadMessages = currentMessages.filter(
        (m) => m.recipientId === recipientId || m.status !== 'read',
      );
      if (currentSocket && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          currentSocket.emit('message:read', { messageId: msg._id });
        }
      }
      clear();
    };
  }, [clear, recipientId]);

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

  const sendTypingStart = useCallback(() => {
    if (!socket) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:start', { conversationId });
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 2000);
  }, [socket, conversationId]);

  const sendTypingStop = useCallback(() => {
    if (!socket) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', { conversationId });
  }, [socket, conversationId]);

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      for (const id of messageIds) {
        updateMessageStatus(id, 'read').catch(() => {});
      }
    },
    [],
  );

  return {
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
  };
}
