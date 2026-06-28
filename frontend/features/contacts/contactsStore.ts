import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { SyncedContact } from './contactsApi';

const CONTACTS_STORAGE_KEY = 'falar_contacts';

interface ContactWithPhone extends SyncedContact {
  phone: string;
}

interface ContactsState {
  contacts: ContactWithPhone[];
  isLoading: boolean;
  lastSyncAt: Date | null;
  permissionDenied: boolean;
  setContacts: (contacts: SyncedContact[]) => void;
  setLoading: (loading: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setPermissionDenied: (denied: boolean) => void;
  loadStoredContacts: () => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  isLoading: false,
  lastSyncAt: null,
  permissionDenied: false,
  setContacts: (contacts) => {
    set({ contacts: contacts as ContactWithPhone[], lastSyncAt: new Date() });
    SecureStore.setItemAsync(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  },
  setLoading: (isLoading) => set({ isLoading }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPermissionDenied: (permissionDenied) => set({ permissionDenied }),
  loadStoredContacts: async () => {
    try {
      const stored = await SecureStore.getItemAsync(CONTACTS_STORAGE_KEY);
      if (stored) {
        const contacts = JSON.parse(stored) as ContactWithPhone[];
        set({ contacts });
      }
    } catch {
      // silent fail
    }
  },
}));
