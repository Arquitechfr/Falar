import api from '@/services/api';

export interface StartCallResponse {
  callId: string;
  conversationId: string;
}

export async function startCall(
  recipientId: string,
  type: 'audio' | 'video',
): Promise<StartCallResponse> {
  const res = await api.post<StartCallResponse>('/calls/start', { recipientId, type });
  return res.data;
}

export async function endCall(
  callId: string,
  status: 'accepted' | 'rejected' | 'ended' | 'missed',
  duration?: number,
): Promise<void> {
  await api.post('/calls/end', { callId, status, duration });
}

export interface CallHistoryItem {
  id: string;
  type: 'audio' | 'video';
  status: string;
  duration: number | null;
  startedAt: string;
  endedAt: string | null;
  outgoing: boolean;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

export async function getCallHistory(): Promise<CallHistoryItem[]> {
  const res = await api.get<{ calls: CallHistoryItem[] }>('/calls/history');
  return res.data.calls;
}
