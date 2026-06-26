import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeScreen } from '@/components/SafeScreen';
import { Avatar } from '@/components/Avatar';
import { useAuthStore } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/useAuth';
import { updateMe } from '@/features/users/usersApi';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateMe({ displayName: displayName.trim() });
      setEditing(false);
    } catch {
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-12">
        <View className="items-center mb-8">
          <Avatar name={user?.displayName || '?'} size={96} />
        </View>

        <View className="bg-surface rounded-xl px-4 py-4 mb-4">
          <Text className="text-textSecondary text-xs mb-1">Téléphone</Text>
          <Text className="text-textPrimary text-base">{user?.phone}</Text>
        </View>

        <View className="bg-surface rounded-xl px-4 py-4 mb-4">
          <Text className="text-textSecondary text-xs mb-1">Nom d'affichage</Text>
          {editing ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 text-textPrimary text-base"
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
              />
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <Text className="text-primary font-semibold">
                  {saving ? '...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-textPrimary text-base">{user?.displayName}</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text className="text-primary text-sm">Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-surface rounded-xl py-4 items-center mt-8"
        >
          <Text className="text-red-500 font-semibold">Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}
