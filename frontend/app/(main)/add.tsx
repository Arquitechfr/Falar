import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { ScreenHeader, Avatar, Button } from '@/components/ui';
import { searchByUsername } from '@/features/users/usersApi';
import { useAuthStore } from '@/features/auth/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { computeConversationId } from '@/utils/conversationId';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import type { UsernameSearchResult } from '@/features/users/usersApi';

export default function AddContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ u?: string }>();
  const username = params.u || '';
  const { colors } = useTheme();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const [user, setUser] = useState<UsernameSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!username.trim()) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const found = await searchByUsername(username.trim());
        setUser(found);
      } catch {
        toast.show('Erreur lors de la recherche', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [username, toast]);

  const handleAdd = useCallback(async () => {
    if (!user || !currentUser) return;
    setAdding(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const conversationId = await computeConversationId(currentUser.id, user.id);
      router.replace({
        pathname: '/(main)/chat/[conversationId]',
        params: {
          conversationId,
          recipientId: user.id,
          recipientPubKey: user.publicKey,
          recipientName: user.displayName,
        },
      });
    } catch {
      setAdding(false);
      toast.show('Impossible de démarrer la conversation', 'error');
    }
  }, [user, currentUser, router, toast]);

  const handleBack = useCallback(() => router.back(), [router]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!user) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ ...typography.subtitle, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
            Utilisateur introuvable
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
            Aucun compte Falar n'est associé au pseudo @{username || 'inconnu'}.
          </Text>
        </View>
      );
    }

    if (!user.allowDirectMessages) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ ...typography.subtitle, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
            Contact désactivé
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
            Cet utilisateur n'accepte pas de nouveaux contacts pour le moment.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
        <Avatar name={user.displayName || '?'} size={120} avatarUrl={user.avatarUrl} />
        <Text style={{ ...typography.heading, color: colors.textPrimary, marginTop: spacing.lg }}>
          {user.displayName || 'Utilisateur'}
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 4 }}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>
            {user.bio}
          </Text>
        ) : null}
        <View style={{ marginTop: spacing.xl, width: '100%', maxWidth: 300 }}>
          <Button
            label={adding ? '...' : 'Ajouter'}
            onPress={handleAdd}
            loading={adding}
            size="lg"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Ajouter un contact"
        onBack={handleBack}
        showBack
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xxl }}>
        {renderContent()}
      </ScrollView>
    </SafeScreen>
  );
}
