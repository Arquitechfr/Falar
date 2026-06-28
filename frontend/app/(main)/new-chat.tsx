import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, SectionList, RefreshControl, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { ScreenHeader, SearchBar, EmptyState, Skeleton } from '@/components/ui';
import { useContacts } from '@/features/contacts/useContacts';
import { ContactItem } from '@/features/contacts/components/ContactItem';
import type { SyncedContact } from '@/features/contacts/contactsApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { Search as SearchIcon, UserPlus } from '@/components/ui/Icons';

export default function NewChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { contacts, isLoading, permissionDenied, syncDeviceContacts, initDeviceContacts, loadStoredContacts } = useContacts();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await loadStoredContacts();
        await initDeviceContacts();
      } catch {
        // silent
      } finally {
        setInitialized(true);
      }
    })();
  }, [loadStoredContacts, initDeviceContacts]);

  const handleSync = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncDeviceContacts();
      toast.show('Contacts synchronisés', 'success');
    } catch (err) {
      if (err instanceof Error && err.message === 'PERMISSION_DENIED') {
        toast.show('Accès aux contacts refusé', 'warning');
      } else {
        toast.show('Erreur de synchronisation', 'error');
      }
    } finally {
      setRefreshing(false);
    }
  }, [syncDeviceContacts, toast]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.contactName?.toLowerCase().includes(q) ||
        c.displayName?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const sections = useMemo(() => {
    const grouped: Record<string, SyncedContact[]> = {};
    filteredContacts.forEach((c) => {
      const firstChar = (c.contactName || c.displayName || '?')[0].toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    });
    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ title: letter, data: grouped[letter] }));
  }, [filteredContacts]);

  const handleContactPress = useCallback((contact: SyncedContact) => {
    if (!contact.isMember || !contact.memberId || !contact.publicKey) return;
    const conversationId = computeConversationId(
      useAuthStore.getState().user?.id || '',
      contact.memberId,
    );
    router.push({
      pathname: '/(main)/chat/[conversationId]',
      params: {
        conversationId,
        recipientId: contact.memberId,
        recipientPubKey: contact.publicKey,
        recipientName: contact.displayName || contact.contactName,
      },
    });
  }, [router]);

  const handleInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `Rejoins-moi sur Falar ! Télécharge l'app : https://falar.app`,
      });
    } catch {
      // silent
    }
  }, []);

  if (isLoading && !refreshing && contacts.length === 0) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Nouvelle conversation" onBack={() => router.back()} showBack />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Skeleton width="100%" height={44} radius={14} />
        </View>
        <View style={{ paddingTop: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Skeleton width={48} height={48} radius={24} style={{ marginRight: spacing.sm + 2 }} />
              <View style={{ gap: 6, flex: 1 }}>
                <Skeleton width="60%" height={16} radius={8} />
                <Skeleton width="40%" height={14} radius={7} />
              </View>
            </View>
          ))}
        </View>
      </SafeScreen>
    );
  }

  if (permissionDenied) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Nouvelle conversation" onBack={() => router.back()} showBack />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un contact"
          />
        </View>
        <EmptyState
          icon={<UserPlus size={32} color={colors.textSecondary} />}
          title="Accès aux contacts requis"
          description="Autorisez l'accès à votre carnet d'adresses pour voir vos contacts sur Falar."
          actionLabel="Autoriser l'accès"
          onAction={handleSync}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Nouvelle conversation" onBack={() => router.back()} showBack />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un contact"
        />
      </View>

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item, index) => `${item.contactName}-${index}`}
        renderItem={({ item }) => (
          <ContactItem contact={item} onPress={handleContactPress} onInvite={handleInvite} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4, backgroundColor: colors.background }}>
            <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>
              {title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: spacing.lg + 48 + spacing.sm + 2 }} />
        )}
        ListEmptyComponent={
          search ? (
            <EmptyState
              icon={<SearchIcon size={32} color={colors.textSecondary} />}
              title="Aucun contact trouvé"
              description={`Aucun contact ne correspond à "${search}"`}
            />
          ) : initialized && contacts.length === 0 ? (
            <EmptyState
              icon={<UserPlus size={32} color={colors.textSecondary} />}
              title="Aucun contact"
              description="Synchronisez votre carnet d'adresses pour voir vos contacts sur Falar."
              actionLabel="Synchroniser"
              onAction={handleSync}
            />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleSync}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeScreen>
  );
}
