import api from '@/services/api';

export interface UserSearchResult {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string;
  publicKey: string;
}

export async function searchUser(phone: string): Promise<UserSearchResult | null> {
  try {
    const res = await api.get<UserSearchResult>('/users/search', { params: { phone } });
    return res.data;
  } catch {
    return null;
  }
}

export async function updateMe(data: {
  displayName?: string;
  avatarUrl?: string;
  deviceToken?: string;
}): Promise<void> {
  await api.put('/users/me', data);
}
