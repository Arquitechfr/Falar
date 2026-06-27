import api from '@/services/api';

export interface SyncedContact {
  contactName: string;
  phone: string;
  isMember: boolean;
  memberId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  username: string | null;
  publicKey: string | null;
}

export interface DeviceContact {
  name: string;
  phone: string;
}

export async function syncContacts(contacts: DeviceContact[]): Promise<SyncedContact[]> {
  const res = await api.post<{ contacts: SyncedContact[] }>('/contacts/sync', { contacts });
  return res.data.contacts;
}

export async function getContacts(): Promise<SyncedContact[]> {
  const res = await api.get<{ contacts: SyncedContact[] }>('/contacts');
  return res.data.contacts;
}
