import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, SectionList, RefreshControl, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import {
  SearchBar,
  Avatar,
  EmptyState,
  Skeleton,
  Badge,
  Button,
} from '@/components/ui';
import { useContacts } from '@/features/contacts/useContacts';
import type { SyncedContact } from '@/features/contacts/contactsApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, UserPlus, Share as ShareIcon, Users as UsersIcon, MessageCircle } from '@/components/ui/Icons';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleInvite = useCallback(async (contact: SyncedContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Skeleton width="100%" height={44} radius={14} />
        </View>
        <View style={{ paddingTop: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {Array.from({ length: 10 }).map((_, i) => (
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
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un contact"
          />
        </View>
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

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un contact"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.contactName}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.isMember ? handleContactPress(item) : handleInvite(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              backgroundColor: pressed ? colors.secondaryBackground : colors.background,
              minHeight: 80,
            })}
          >
            <Avatar
              name={item.displayName || item.contactName}
              size={56}
              avatarUrl={item.avatarUrl || undefined}
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text
                  style={{
                    ...typography.subtitle,
                    color: colors.textPrimary,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.contactName}
                </Text>
                {item.isMember ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleContactPress(item);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      backgroundColor: pressed ? colors.primaryDark : colors.primary,
                      borderRadius: 20,
                      marginLeft: spacing.sm,
                    })}
                  >
                    <MessageCircle size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '600' }}>
                      Message
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleInvite(item);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      backgroundColor: pressed ? colors.primaryDark : colors.primary,
                      borderRadius: 20,
                      marginLeft: spacing.sm,
                    })}
                  >
                    <ShareIcon size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '600' }}>
                      Inviter
                    </Text>
                  </Pressable>
                )}
              </View>
              <Text
                style={{
                  ...typography.body,
                  color: colors.textSecondary,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {item.phone}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.isMember && item.displayName && item.displayName !== item.contactName && (
                  <Text style={{ ...typography.caption, color: colors.textTertiary, marginRight: 8 }} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                )}
                {item.isMember && item.username && (
                  <Text style={{ ...typography.caption, color: colors.textTertiary }} numberOfLines={1}>
                    @{item.username}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4, backgroundColor: colors.background }}>
            <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>
              {title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: spacing.lg + 56 + spacing.md }} />
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
        contentContainerStyle={{ paddingBottom: 100 }}
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
