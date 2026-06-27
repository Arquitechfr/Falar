import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, SectionList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { ScreenHeader, SearchBar, Avatar, EmptyState, Skeleton } from '@/components/ui';
import { getContacts, type UserProfile } from '@/features/users/usersApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { Search as SearchIcon, UserPlus } from '@/components/ui/Icons';

export default function NewChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch {
      toast.show('Erreur lors du chargement des contacts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useMemo(() => { loadContacts(); }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.displayName?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [contacts, search]);

  const sections = useMemo(() => {
    const grouped: Record<string, UserProfile[]> = {};
    filteredContacts.forEach((c) => {
      const firstChar = (c.displayName || c.phone || '?')[0].toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    });
    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ title: letter, data: grouped[letter] }));
  }, [filteredContacts]);

  const handleContactPress = useCallback((contact: UserProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const conversationId = computeConversationId(
      useAuthStore.getState().user?.id || '',
      contact.id,
    );
    router.push({
      pathname: '/(main)/chat/[conversationId]',
      params: {
        conversationId,
        recipientId: contact.id,
        recipientPubKey: contact.publicKey,
        recipientName: contact.displayName,
      },
    });
  }, [router]);

  if (loading) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Nouvelle conversation" onBack={() => router.back()} showBack />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Skeleton width="100%" height={44} radius={14} />
        </View>
        <View style={{ paddingTop: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Skeleton width={48} height={48} radius={24} />
              <View style={{ gap: 6 }}>
                <Skeleton width={120} height={16} radius={8} />
                <Skeleton width={80} height={14} radius={7} />
              </View>
            </View>
          ))}
        </View>
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
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleContactPress(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              gap: spacing.sm + 2,
              backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
            })}
          >
            <Avatar name={item.displayName || item.phone} size={48} avatarUrl={item.avatarUrl} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.subtitle, color: colors.textPrimary }} numberOfLines={1}>
                {item.displayName || item.phone}
              </Text>
              {item.username && (
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                  @{item.username}
                </Text>
              )}
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
          <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: spacing.lg + 48 + spacing.sm + 2 }} />
        )}
        ListEmptyComponent={
          search ? (
            <EmptyState
              icon={<SearchIcon size={32} color={colors.textSecondary} />}
              title="Aucun contact trouvé"
              description={`Aucun contact ne correspond à "${search}"`}
            />
          ) : (
            <EmptyState
              icon={<UserPlus size={32} color={colors.textSecondary} />}
              title="Aucun contact"
              description="Vos contacts apparaîtront ici une fois que vous aurez commencé une conversation"
            />
          )
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadContacts(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeScreen>
  );
}
