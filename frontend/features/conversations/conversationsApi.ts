import api from '@/services/api';

export interface ConversationSummary {
  conversationId: string;
  lastMessage: {
    encryptedPayload: string;
    nonce: string;
    senderId: string;
  };
  lastTimestamp: string;
  unreadCount: number;
  participantId: string;
  participantDisplayName: string;
  participantPublicKey: string;
  participantAvatarUrl: string;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<{ conversations: ConversationSummary[] }>('/messages/conversations');
  return res.data.conversations;
}
