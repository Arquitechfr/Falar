import { useCallback } from 'react';
import * as Contacts from 'expo-contacts';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { syncContacts, getContacts, type SyncedContact, type DeviceContact } from './contactsApi';
import { useContactsStore } from './contactsStore';

function normalizeToE164(phone: string): string | null {
  const parsed = parsePhoneNumberFromString(phone);
  if (parsed && parsed.isValid()) {
    return parsed.number;
  }
  if (phone.startsWith('+')) {
    return phone.replace(/[^+0-9]/g, '');
  }
  return null;
}

export function useContacts() {
  const store = useContactsStore();

  const loadStoredContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const contacts = await getContacts();
    store.setContacts(contacts);
    return contacts;
  }, [store]);

  const syncDeviceContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      store.setPermissionDenied(true);
      throw new Error('PERMISSION_DENIED');
    }
    store.setPermissionDenied(false);

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      pageSize: 5000,
    });

    const deviceContacts: DeviceContact[] = [];
    for (const contact of data) {
      const name = contact.name || contact.firstName || 'Inconnu';
      if (!contact.phoneNumbers) continue;
      for (const phoneEntry of contact.phoneNumbers) {
        const normalized = normalizeToE164(phoneEntry.number || '');
        if (normalized) {
          deviceContacts.push({ name, phone: normalized });
        }
      }
    }

    if (deviceContacts.length === 0) {
      store.setContacts([]);
      return [];
    }

    store.setLoading(true);
    try {
      const synced = await syncContacts(deviceContacts);
      store.setContacts(synced);
      return synced;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  return {
    contacts: store.contacts,
    isLoading: store.isLoading,
    lastSyncAt: store.lastSyncAt,
    permissionDenied: store.permissionDenied,
    syncDeviceContacts,
    loadStoredContacts,
  };
}
