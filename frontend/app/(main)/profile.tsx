import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeScreen } from '@/components/SafeScreen';
import { useAuthStore } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/useAuth';
import { updateMe } from '@/features/users/usersApi';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { Avatar, Input, Button, ActionSheet, Modal } from '@/components/ui';
import { Shield, Phone, User, Bell, LogOut, Edit, Camera, QrCode, Share as ShareIcon, Settings as SettingsIcon, ChevronRight } from '@/components/ui/Icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleSave = useCallback(async (field: string) => {
    setSaving(true);
    try {
      const data: Record<string, string> = {};
      if (field === 'name') data.displayName = displayName.trim();
      if (field === 'bio') data.bio = bio.trim();
      if (field === 'username') data.username = username.trim();
      await updateMe(data);
      useAuthStore.getState().login({ ...user!, ...data });
      setEditingField(null);
      toast.show('Profil mis à jour', 'success');
    } catch {
      toast.show('Échec de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  }, [displayName, bio, username, user, toast]);

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as never);

      const api = (await import('@/services/api')).default;
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = res.data.mediaUrl;
      await updateMe({ avatarUrl });
      useAuthStore.getState().login({ ...user!, avatarUrl });
      toast.show('Photo de profil mise à jour', 'success');
    } catch {
      toast.show('Échec du téléversement', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, toast]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Ajoutez-moi sur Falar : ${user?.phone}`,
      });
    } catch {
      // silent
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    setShowLogout(false);
    logout();
  }, [logout]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
    setUsername(user?.username || '');
  }, [user]);

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header with avatar */}
        <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
          <Pressable onPress={handlePickAvatar} disabled={saving}>
            <View>
              <Avatar name={user?.displayName || '?'} size={96} avatarUrl={user?.avatarUrl} />
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: colors.background,
                }}
              >
                <Camera size={16} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginTop: spacing.md }}>
            {user?.displayName || 'Utilisateur'}
          </Text>
          {user?.username ? (
            <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 4 }}>
              @{user.username}
            </Text>
          ) : null}
          {user?.bio ? (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }}>
              {user.bio}
            </Text>
          ) : null}
        </View>

        {/* Action buttons row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => setShowQR(true)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              paddingVertical: spacing.sm + 2,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <QrCode size={18} color={colors.primary} />
            <Text style={{ ...typography.captionMedium, color: colors.primary }}>QR Code</Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              paddingVertical: spacing.sm + 2,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ShareIcon size={18} color={colors.primary} />
            <Text style={{ ...typography.captionMedium, color: colors.primary }}>Partager</Text>
          </Pressable>
        </View>

        {/* Cards */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Phone */}
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Phone size={18} color={colors.textSecondary} />
              <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>Téléphone</Text>
            </View>
            <Text style={{ ...typography.body, color: colors.textPrimary }}>{user?.phone}</Text>
          </View>

          {/* Display Name */}
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <User size={18} color={colors.textSecondary} />
                <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>Nom d'affichage</Text>
              </View>
              {editingField !== 'name' && (
                <Pressable onPress={() => setEditingField('name')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Edit size={14} color={colors.primary} />
                  <Text style={{ ...typography.captionMedium, color: colors.primary }}>Modifier</Text>
                </Pressable>
              )}
            </View>
            {editingField === 'name' ? (
              <View style={{ gap: spacing.sm }}>
                <Input value={displayName} onChangeText={setDisplayName} autoFocus returnKeyType="done" onSubmitEditing={() => handleSave('name')} />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button label="Annuler" onPress={cancelEdit} variant="secondary" size="md" />
                  <Button label={saving ? '...' : 'Enregistrer'} onPress={() => handleSave('name')} loading={saving} size="md" />
                </View>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textPrimary }}>{user?.displayName}</Text>
            )}
          </View>

          {/* Username */}
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>Pseudo</Text>
              </View>
              {editingField !== 'username' && (
                <Pressable onPress={() => setEditingField('username')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Edit size={14} color={colors.primary} />
                  <Text style={{ ...typography.captionMedium, color: colors.primary }}>Modifier</Text>
                </Pressable>
              )}
            </View>
            {editingField === 'username' ? (
              <View style={{ gap: spacing.sm }}>
                <Input value={username} onChangeText={setUsername} autoFocus placeholder="mon_pseudo" returnKeyType="done" onSubmitEditing={() => handleSave('username')} />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button label="Annuler" onPress={cancelEdit} variant="secondary" size="md" />
                  <Button label={saving ? '...' : 'Enregistrer'} onPress={() => handleSave('username')} loading={saving} size="md" />
                </View>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {user?.username ? `@${user.username}` : 'Non défini'}
              </Text>
            )}
          </View>

          {/* Bio */}
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ ...typography.captionMedium, color: colors.textSecondary }}>Bio</Text>
              {editingField !== 'bio' && (
                <Pressable onPress={() => setEditingField('bio')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Edit size={14} color={colors.primary} />
                  <Text style={{ ...typography.captionMedium, color: colors.primary }}>Modifier</Text>
                </Pressable>
              )}
            </View>
            {editingField === 'bio' ? (
              <View style={{ gap: spacing.sm }}>
                <Input value={bio} onChangeText={setBio} autoFocus placeholder="Quelques mots sur vous..." returnKeyType="done" onSubmitEditing={() => handleSave('bio')} />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button label="Annuler" onPress={cancelEdit} variant="secondary" size="md" />
                  <Button label={saving ? '...' : 'Enregistrer'} onPress={() => handleSave('bio')} loading={saving} size="md" />
                </View>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {user?.bio || 'Aucune bio'}
              </Text>
            )}
          </View>

          {/* Encryption */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md }}>
            <Shield size={18} color={colors.success} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>
              Vos messages sont chiffrés de bout en bout. Vos clés ne quittent jamais votre appareil.
            </Text>
          </View>

          {/* Settings */}
          <Pressable
            onPress={() => router.push('/(main)/settings')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SettingsIcon size={18} color={colors.textSecondary} />
            </View>
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>Paramètres</Text>
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronRight size={18} color={colors.textSecondary} />
            </View>
          </Pressable>

          {/* Notifications */}
          <Pressable
            onPress={() => router.push('/(main)/notifications')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={18} color={colors.textSecondary} />
            </View>
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>Notifications</Text>
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronRight size={18} color={colors.textSecondary} />
            </View>
          </Pressable>

          {/* Logout */}
          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: colors.card,
              borderRadius: radii.md,
              padding: spacing.md,
              marginTop: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={18} color={colors.danger} />
            </View>
            <Text style={{ ...typography.bodyMedium, color: colors.danger }}>Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQR} onClose={() => setShowQR(false)} title="Mon QR Code">
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={{ backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' }}>
            <QrCode size={180} color={colors.textPrimary} />
          </View>
          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
            Scannez ce code pour ajouter {user?.displayName || 'cet utilisateur'} sur Falar
          </Text>
          <Text style={{ ...typography.captionMedium, color: colors.primary }}>{user?.phone}</Text>
        </View>
      </Modal>

      {/* Logout confirmation */}
      <ActionSheet
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        title="Déconnexion"
        actions={[
          {
            label: 'Se déconnecter',
            icon: <LogOut size={20} color={colors.danger} />,
            onPress: handleLogout,
            destructive: true,
          },
        ]}
      />
    </SafeScreen>
  );
}
