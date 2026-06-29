import api from '@/services/api';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  encryptedPayload: string;
  nonce: string;
  mediaUrl: string;
  status: 'sent' | 'delivered' | 'read';
  clientTimestamp: string;
  serverTimestamp: string;
  createdAt: string;
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export async function getMessages(
  conversationId: string,
  before?: string,
  limit: number = 30,
): Promise<GetMessagesResponse> {
  const queryParams = new URLSearchParams({ limit: limit.toString() });
  if (before) queryParams.append('before', before);
  const res = await api.get<GetMessagesResponse>(`/messages/${conversationId}?${queryParams.toString()}`);
  return res.data;
}

export async function sendMessage(data: {
  recipientId: string;
  encryptedPayload: string;
  nonce: string;
  mediaUrl?: string;
  clientTimestamp: string;
}): Promise<{ messageId: string; serverTimestamp: string }> {
  const res = await api.post('/messages/send', data);
  return res.data;
}

export async function updateMessageStatus(
  messageId: string,
  status: 'delivered' | 'read',
): Promise<void> {
  await api.patch(`/messages/${messageId}/status`, { status });
}

export async function deleteMessage(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}
