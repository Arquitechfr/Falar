import { useState, useCallback, useMemo } from 'react';
import { View, Text, RefreshControl, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { ConversationItem } from '@/components/ConversationItem';
import { useConversations, type DecryptedConversation } from '@/features/conversations/useConversations';
import { searchUser } from '@/features/users/usersApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import {
  SearchBar,
  FloatingButton,
  BottomSheet,
  EmptyState,
  Skeleton,
  Button,
  Input,
  Avatar,
} from '@/components/ui';
import { Plus, MessageCircle, Search as SearchIcon } from '@/components/ui/Icons';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const [showSearch, setShowSearch] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const filteredConversations = useMemo(() => {
    if (!localSearch.trim()) return conversations ?? [];
    const q = localSearch.toLowerCase();
    return (conversations ?? []).filter(
      (c) =>
        c.participantDisplayName?.toLowerCase().includes(q) ||
        c.lastMessagePreview?.toLowerCase().includes(q),
    );
  }, [conversations, localSearch]);

  const handleSearch = useCallback(async () => {
    if (!searchPhone.trim()) return;
    setSearching(true);
    try {
      const user = await searchUser(searchPhone.trim());
      if (user) {
        setShowSearch(false);
        setSearchPhone('');
        const conversationId = computeConversationId(
          useAuthStore.getState().user?.id || '',
          user.id,
        );
        router.push({
          pathname: '/(main)/chat/[conversationId]',
          params: {
            conversationId,
            recipientId: user.id,
            recipientPubKey: user.publicKey,
            recipientName: user.displayName,
          },
        });
      } else {
        toast.show('Aucun utilisateur trouvé', 'warning');
      }
    } catch {
      toast.show('Erreur lors de la recherche', 'error');
    } finally {
      setSearching(false);
    }
  }, [searchPhone, router, toast]);

  const handleConversationPress = useCallback((conv: DecryptedConversation) => {
    router.push({
      pathname: '/(main)/chat/[conversationId]',
      params: {
        conversationId: conv.conversationId,
        recipientId: conv.participantId,
        recipientPubKey: conv.participantPublicKey,
        recipientName: conv.participantDisplayName,
      },
    });
  }, [router]);

  const renderSkeleton = useCallback(() => (
    <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, flexDirection: 'row', alignItems: 'center' }}>
      <Skeleton width={52} height={52} radius={26} style={{ marginRight: spacing.sm + 2 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={16} radius={8} />
        <Skeleton width="90%" height={14} radius={7} />
      </View>
    </View>
  ), []);

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Skeleton width="50%" height={28} radius={8} />
        </View>
        <View style={{ paddingTop: spacing.sm }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i}>{renderSkeleton()}</View>
          ))}
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>
              {getGreeting()},
            </Text>
            <Text style={{ ...typography.heading, color: colors.textPrimary }}>
              {user?.displayName?.split(' ')[0] || 'Falar'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(main)/profile')} hitSlop={12}>
            <Avatar name={user?.displayName || '?'} size={40} avatarUrl={user?.avatarUrl} />
          </Pressable>
        </View>
        <SearchBar
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder="Rechercher une conversation"
        />
      </View>

      <FlashList
        data={filteredConversations}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => (
          <ConversationItem
            contact={item.participantDisplayName || item.participantId}
            lastMessagePreview={item.lastMessagePreview}
            lastTimestamp={item.lastTimestamp}
            unreadCount={item.unreadCount}
            avatarUrl={item.participantAvatarUrl}
            onPress={() => handleConversationPress(item)}
          />
        )}
        estimatedItemSize={72}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: spacing.md + 52 + spacing.sm + 2 }} />
        )}
        ListEmptyComponent={
          localSearch ? (
            <EmptyState
              icon={<SearchIcon size={32} color={colors.textSecondary} />}
              title="Aucun résultat"
              description={`Aucune conversation ne correspond à "${localSearch}"`}
            />
          ) : (
            <EmptyState
              icon={<MessageCircle size={32} color={colors.textSecondary} />}
              title="Aucune conversation"
              description="Démarrez une nouvelle conversation en appuyant sur le bouton +"
              actionLabel="Nouvelle conversation"
              onAction={() => setShowSearch(true)}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: spacing.lg + 60,
          right: spacing.lg,
        }}
      >
        <FloatingButton
          onPress={() => setShowSearch(true)}
          icon={<Plus size={24} color="#FFFFFF" />}
        />
      </View>

      <BottomSheet
        visible={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchPhone('');
        }}
        snapPoint="50%"
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Text style={{ ...typography.subtitle, color: colors.textPrimary }}>
            Rechercher un utilisateur
          </Text>
          <Input
            value={searchPhone}
            onChangeText={setSearchPhone}
            placeholder="+33612345678"
            keyboardType="phone-pad"
            leftIcon={<SearchIcon size={20} color={colors.textSecondary} />}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Button
            label={searching ? 'Recherche...' : 'Rechercher'}
            onPress={handleSearch}
            loading={searching}
            disabled={!searchPhone.trim()}
            fullWidth
          />
        </View>
      </BottomSheet>
    </SafeScreen>
  );
}
