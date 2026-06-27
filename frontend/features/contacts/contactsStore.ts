import { create } from 'zustand';
import type { SyncedContact } from './contactsApi';

interface ContactsState {
  contacts: SyncedContact[];
  isLoading: boolean;
  lastSyncAt: Date | null;
  permissionDenied: boolean;
  setContacts: (contacts: SyncedContact[]) => void;
  setLoading: (loading: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setPermissionDenied: (denied: boolean) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  isLoading: false,
  lastSyncAt: null,
  permissionDenied: false,
  setContacts: (contacts) => set({ contacts, lastSyncAt: new Date() }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPermissionDenied: (permissionDenied) => set({ permissionDenied }),
}));
