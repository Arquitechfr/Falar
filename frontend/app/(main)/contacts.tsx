import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, SectionList, RefreshControl, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import {
  SearchBar,
  EmptyState,
  Skeleton,
  Card,
  ScreenHeader,
} from '@/components/ui';
import { useContacts } from '@/features/contacts/useContacts';
import { ContactItem } from '@/features/contacts/components/ContactItem';
import type { SyncedContact } from '@/features/contacts/contactsApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import {
  Search as SearchIcon,
  UserPlus,
  Users as UsersIcon,
} from '@/components/ui/Icons';

export default function ContactsScreen() {
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
        // silent — will show empty state
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
    const sorted = [...filteredContacts].sort((a, b) =>
      (a.contactName || '').localeCompare(b.contactName || ''),
    );
    const members = sorted.filter((c) => c.isMember);
    const nonMembers = sorted.filter((c) => !c.isMember);
    const result: { title: string; data: SyncedContact[] }[] = [];
    if (members.length > 0) {
      result.push({ title: `Membres Falar · ${members.length}`, data: members });
    }
    if (nonMembers.length > 0) {
      result.push({ title: `Inviter sur Falar · ${nonMembers.length}`, data: nonMembers });
    }
    return result;
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
        <ScreenHeader title="Contacts" showBack={false} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
          <Skeleton width="100%" height={44} radius={14} />
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {Array.from({ length: 2 }).map((_, sectionIndex) => (
            <View key={sectionIndex} style={{ gap: spacing.sm }}>
              <Skeleton width="40%" height={14} radius={7} />
              {Array.from({ length: 5 }).map((__, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={52} height={52} radius={26} style={{ marginRight: spacing.sm + 2 }} />
                  <View style={{ gap: 6, flex: 1 }}>
                    <Skeleton width="60%" height={16} radius={8} />
                    <Skeleton width="40%" height={14} radius={7} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </SafeScreen>
    );
  }

  if (permissionDenied) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Contacts" showBack={false} />
        <EmptyState
          icon={<UsersIcon size={32} color={colors.textSecondary} />}
          title="Accès aux contacts requis"
          description="Autorisez l'accès à votre carnet d'adresses pour voir vos contacts sur Falar."
          actionLabel="Autoriser l'accès"
          onAction={handleSync}
        />
      </SafeScreen>
    );
  }

  if (initialized && contacts.length === 0 && !search) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Contacts" showBack={false} />
        <EmptyState
          icon={<UserPlus size={32} color={colors.textSecondary} />}
          title="Aucun contact"
          description="Synchronisez votre carnet d'adresses pour voir vos contacts sur Falar."
          actionLabel="Synchroniser"
          onAction={handleSync}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Contacts"
        showBack={false}
        rightActions={
          <Pressable
            onPress={handleSync}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            disabled={refreshing}
          >
            <Text style={{ ...typography.captionMedium, color: colors.primary }}>
              Synchro
            </Text>
          </Pressable>
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <Card padding={spacing.md}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un contact"
          />
        </Card>
      </View>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item, index) => `${item.contactName}-${index}`}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
            <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          return (
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: isFirst ? radii.md : 0,
                borderTopRightRadius: isFirst ? radii.md : 0,
                borderBottomLeftRadius: isLast ? radii.md : 0,
                borderBottomRightRadius: isLast ? radii.md : 0,
              }}
            >
              <ContactItem contact={item} onPress={handleContactPress} onInvite={handleInvite} />
            </View>
          );
        }}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 52 + (spacing.sm + 2) + spacing.md,
            }}
          />
        )}
        ListEmptyComponent={
          search ? (
            <EmptyState
              icon={<SearchIcon size={32} color={colors.textSecondary} />}
              title="Aucun contact trouvé"
              description={`Aucun contact ne correspond à "${search}"`}
            />
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
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
