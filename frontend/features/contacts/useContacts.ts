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
  const data = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], { limit: 2000 });
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
  const contacts = useContactsStore((s) => s.contacts);
  const isLoading = useContactsStore((s) => s.isLoading);
  const lastSyncAt = useContactsStore((s) => s.lastSyncAt);
  const permissionDenied = useContactsStore((s) => s.permissionDenied);
  const setContacts = useContactsStore((s) => s.setContacts);
  const setLoading = useContactsStore((s) => s.setLoading);
  const setPermissionDenied = useContactsStore((s) => s.setPermissionDenied);
  const loadStoredContactsFromStore = useContactsStore((s) => s.loadStoredContacts);

  const loadStoredContacts = useCallback(async (): Promise<SyncedContact[]> => {
    await loadStoredContactsFromStore();
    return useContactsStore.getState().contacts;
  }, [loadStoredContactsFromStore]);

  const syncDeviceContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const { status } = await requestPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      throw new Error('PERMISSION_DENIED');
    }
    setPermissionDenied(false);

    const deviceContacts = await fetchDeviceContacts();
    if (deviceContacts.length === 0) {
      setContacts([]);
      return [];
    }

    setLoading(true);
    try {
      const synced = await syncContacts(deviceContacts);
      setContacts(synced);
      return synced;
    } finally {
      setLoading(false);
    }
  }, [setContacts, setLoading, setPermissionDenied]);

  const initDeviceContacts = useCallback(async (): Promise<SyncedContact[]> => {
    const { status } = await getPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      return [];
    }
    setPermissionDenied(false);

    if (useContactsStore.getState().contacts.length > 0) {
      return useContactsStore.getState().contacts;
    }

    const deviceContacts = await fetchDeviceContacts();
    if (deviceContacts.length === 0) {
      setContacts([]);
      return [];
    }

    setLoading(true);
    try {
      const synced = await syncContacts(deviceContacts);
      setContacts(synced);
      return synced;
    } finally {
      setLoading(false);
    }
  }, [setContacts, setLoading, setPermissionDenied]);

  return {
    contacts,
    isLoading,
    lastSyncAt,
    permissionDenied,
    syncDeviceContacts,
    initDeviceContacts,
    loadStoredContacts,
  };
}
