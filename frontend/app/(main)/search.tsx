import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, SectionList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { ScreenHeader, SearchBar, Avatar, EmptyState, Skeleton } from '@/components/ui';
import api from '@/services/api';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { Search as SearchIcon, User, ImageIcon, Clock } from '@/components/ui/Icons';

interface SearchResult {
  users: Array<{ id: string; displayName: string; avatarUrl: string; username: string; phone: string }>;
  media: Array<{ id: string; mediaUrl: string; conversationId: string; timestamp: string }>;
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ users: [], media: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ users: [], media: [] });
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get<SearchResult>('/search', { params: { q } });
      setResults(res.data);
    } catch {
      toast.show('Erreur lors de la recherche', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timeout = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query, handleSearch]);

  const handleUserPress = useCallback((userId: string, displayName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const conversationId = computeConversationId(
      useAuthStore.getState().user?.id || '',
      userId,
    );
    router.push({
      pathname: '/(main)/chat/[conversationId]',
      params: { conversationId, recipientId: userId, recipientName: displayName },
    });
  }, [router]);

  const sections = [
    { title: 'Contacts', data: results.users, icon: <User size={16} color={colors.textSecondary} /> },
    { title: 'Médias', data: results.media, icon: <ImageIcon size={16} color={colors.textSecondary} /> },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Rechercher" onBack={() => router.back()} showBack />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher des contacts, médias..."
          autoFocus
        />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Skeleton width={48} height={48} radius={24} style={{ marginRight: spacing.sm }} />
              <View style={{ gap: 6 }}>
                <Skeleton width={140} height={16} radius={8} />
                <Skeleton width={80} height={14} radius={7} />
              </View>
            </View>
          ))}
        </View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, section }) => {
            if (section.title === 'Contacts') {
              const user = item as SearchResult['users'][0];
              return (
                <Pressable
                  onPress={() => handleUserPress(user.id, user.displayName)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm + 2,
                    backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
                  })}
                >
                  <Avatar name={user.displayName || user.phone} size={48} avatarUrl={user.avatarUrl} style={{ marginRight: spacing.sm + 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.subtitle, color: colors.textPrimary }} numberOfLines={1}>
                      {user.displayName || user.phone}
                    </Text>
                    {user.username && (
                      <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                        @{user.username}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }
            const media = item as SearchResult['media'][0];
            return (
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm + 2,
                  backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
                })}
              >
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.secondaryBackground, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm + 2 }}>
                  <ImageIcon size={20} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.body, color: colors.textPrimary }} numberOfLines={1}>
                    {media.mediaUrl.split('/').pop() || 'Média'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    {new Date(media.timestamp).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          renderSectionHeader={({ section }) => (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ marginRight: 6 }}>{section.icon}</View>
              <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>
                {section.title.toUpperCase()}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      ) : searched ? (
        <EmptyState
          icon={<SearchIcon size={32} color={colors.textSecondary} />}
          title="Aucun résultat"
          description={`Aucun résultat pour "${query}"`}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <Clock size={48} color={colors.textSecondary} />
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>
            Recherchez des contacts et des médias partagés
          </Text>
        </View>
      )}
    </SafeScreen>
  );
}
