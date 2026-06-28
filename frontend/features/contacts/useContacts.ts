import { useCallback } from 'react';
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
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

async function fetchDeviceContacts(): Promise<DeviceContact[]> {
  const data = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], { limit: 10000 });
  const deviceContacts: DeviceContact[] = [];
  for (const contact of data) {
    const name = contact.fullName || 'Inconnu';
    if (!contact.phones || contact.phones.length === 0) continue;
    for (const phoneEntry of contact.phones) {
      const normalized = normalizeToE164(phoneEntry.number || '');
      if (normalized) {
        deviceContacts.push({ name, phone: normalized });
      }
    }
  }
  return deviceContacts;
}

export function useContacts() {
  const store = useContactsStore();

  const loadStoredContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const contacts = await getContacts();
    store.setContacts(contacts);
    return contacts;
  }, [store]);

  const syncDeviceContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const { status } = await requestPermissionsAsync();
    if (status !== 'granted') {
      store.setPermissionDenied(true);
      throw new Error('PERMISSION_DENIED');
    }
    store.setPermissionDenied(false);

    const deviceContacts = await fetchDeviceContacts();
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

  const initDeviceContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const { status } = await getPermissionsAsync();
    if (status !== 'granted') {
      store.setPermissionDenied(true);
      return [];
    }
    store.setPermissionDenied(false);

    if (store.contacts.length > 0) {
      return store.contacts;
    }

    const deviceContacts = await fetchDeviceContacts();
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
    initDeviceContacts,
    loadStoredContacts,
  };
}
