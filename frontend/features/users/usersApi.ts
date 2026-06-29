import api from '@/services/api';

export interface UserSearchResult {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  username: string;
  publicKey: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  username: string;
  publicKey: string;
  lastSeen: string;
}

export async function searchUser(phone: string): Promise<UserSearchResult | null> {
  try {
    const res = await api.get<UserSearchResult>(`/users/search?phone=${encodeURIComponent(phone)}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const res = await api.get<UserProfile>(`/users/${userId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getContacts(): Promise<UserProfile[]> {
  try {
    const res = await api.get<{ contacts: UserProfile[] }>('/users/contacts');
    return res.data.contacts;
  } catch {
    return [];
  }
}

export async function updateMe(data: {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  username?: string;
  deviceToken?: string;
}): Promise<void> {
  await api.put('/users/me', data);
}
