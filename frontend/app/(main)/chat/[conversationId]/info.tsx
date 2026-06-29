import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { List } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/SafeScreen';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { ScreenHeader, Avatar, ActionSheet } from '@/components/ui';
import { getUserById, type UserProfile } from '@/features/users/usersApi';
import { Phone, Video, Search, ImageIcon, FileText, Star, Bell, Block, Trash, Shield } from '@/components/ui/Icons';

export default function ConversationInfoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{
    conversationId: string;
    recipientId: string;
    recipientName: string;
  }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlock, setShowBlock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (params.recipientId) {
      getUserById(params.recipientId).then((data) => {
        setProfile(data);
        setLoading(false);
      });
    }
  }, [params.recipientId]);

  const handleBlock = useCallback(() => {
    setShowBlock(false);
    toast.show('Utilisateur bloqué', 'warning');
    router.back();
  }, [toast, router]);

  const handleDelete = useCallback(() => {
    setShowDelete(false);
    toast.show('Conversation supprimée', 'success');
    router.replace('/(main)/conversations');
  }, [toast, router]);

  const isOnline = profile?.lastSeen ? Date.now() - new Date(profile.lastSeen).getTime() < 60000 : false;

  const actions = [
    { icon: <Phone size={22} color={colors.primary} />, label: 'Appeler' },
    { icon: <Video size={22} color={colors.primary} />, label: 'Vidéo' },
    { icon: <Search size={22} color={colors.primary} />, label: 'Rechercher' },
    { icon: <ImageIcon size={22} color={colors.primary} />, label: 'Médias' },
  ];

  const menuItems = [
    { icon: <FileText size={20} color={colors.textSecondary} />, label: 'Documents', value: '0' },
    { icon: <Star size={20} color={colors.textSecondary} />, label: 'Messages favoris', value: '0' },
    { icon: <Bell size={20} color={colors.textSecondary} />, label: 'Notifications', value: 'Activées' },
  ];

  if (loading) {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Profil" onBack={() => router.back()} showBack />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Profil" onBack={() => router.back()} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
          <Avatar
            name={profile?.displayName || params.recipientName || '?'}
            size={100}
            avatarUrl={profile?.avatarUrl}
            online={isOnline}
          />
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginTop: spacing.md }}>
            {profile?.displayName || params.recipientName || 'Utilisateur'}
          </Text>
          {profile?.username && (
            <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 4 }}>
              @{profile.username}
            </Text>
          )}
          <Text style={{ ...typography.caption, color: isOnline ? colors.success : colors.textSecondary, marginTop: spacing.xs }}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
          {profile?.bio && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                marginRight: index < actions.length - 1 ? spacing.sm : 0,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ marginBottom: 6 }}>{action.icon}</View>
              <Text style={{ ...typography.caption, color: colors.textPrimary }}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Menu items */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, overflow: 'hidden' }}>
            {menuItems.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.label}
                  titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
                  description={item.value}
                  descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
                  left={() => <View style={{ justifyContent: 'center', paddingLeft: spacing.md }}>{item.icon}</View>}
                  style={{ paddingVertical: spacing.sm }}
                />
                {index < menuItems.length - 1 && <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 56 }} />}
              </View>
            ))}
          </View>

          {/* Encryption info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md }}>
            <Shield size={18} color={colors.success} style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>
              Les messages de cette conversation sont chiffrés de bout en bout.
            </Text>
          </View>

          {/* Danger zone */}
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, overflow: 'hidden' }}>
            <List.Item
              title="Bloquer"
              titleStyle={{ color: colors.danger, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => <View style={{ justifyContent: 'center', paddingLeft: spacing.md }}><Block size={20} color={colors.danger} /></View>}
              onPress={() => setShowBlock(true)}
              style={{ paddingVertical: spacing.sm }}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 56 }} />
            <List.Item
              title="Supprimer la conversation"
              titleStyle={{ color: colors.danger, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => <View style={{ justifyContent: 'center', paddingLeft: spacing.md }}><Trash size={20} color={colors.danger} /></View>}
              onPress={() => setShowDelete(true)}
              style={{ paddingVertical: spacing.sm }}
            />
          </View>
        </View>
      </ScrollView>

      <ActionSheet
        visible={showBlock}
        onClose={() => setShowBlock(false)}
        title={`Bloquer ${profile?.displayName || 'cet utilisateur'} ?`}
        actions={[
          { label: 'Bloquer', icon: <Block size={20} color={colors.danger} />, onPress: handleBlock, destructive: true },
        ]}
      />

      <ActionSheet
        visible={showDelete}
        onClose={() => setShowDelete(false)}
        title="Supprimer cette conversation ?"
        actions={[
          { label: 'Supprimer', icon: <Trash size={20} color={colors.danger} />, onPress: handleDelete, destructive: true },
        ]}
      />
    </SafeScreen>
  );
}
