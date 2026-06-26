import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deriveKeypair } from '@/features/crypto/keyDerivation';
import { verifyOtp } from '@/features/auth/authApi';
import { setTokens } from '@/services/api';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { registerForPushNotifications } from '@/services/notifications';
import { theme } from '@/constants/theme';

export default function PasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; code: string; isNewUser: string }>();
  const isNewUser = params.isNewUser === 'true';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      Alert.alert('Erreur', 'Entrez un mot de passe');
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const { privateKey, publicKey, publicKeyBase64 } = await deriveKeypair(
        password,
        params.phone,
      );

      const deviceToken = await registerForPushNotifications();

      const result = await verifyOtp(
        params.phone,
        params.code,
        publicKeyBase64,
        deviceToken || undefined,
      );

      await setTokens(result.accessToken, result.refreshToken);
      useCryptoStore.getState().setKeys(privateKey, publicKey);
      useAuthStore.getState().login(result.user);

      router.replace('/(main)/conversations');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Erreur', msg || 'Échec de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6"
      >
        <View className="flex-1 justify-center">
          <Text className="text-2xl font-bold text-textPrimary mb-2">
            {isNewUser ? 'Créer un mot de passe' : 'Votre mot de passe'}
          </Text>
          <Text className="text-textSecondary mb-8">
            {isNewUser
              ? 'Ce mot de passe sert à dériver vos clés de chiffrement'
              : 'Entrez votre mot de passe pour dériver vos clés'}
          </Text>

          <View className="flex-row items-center bg-surface rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 py-4 text-textPrimary text-base"
              placeholder="Mot de passe"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text className="text-textSecondary text-sm">
                {showPassword ? 'Masquer' : 'Afficher'}
              </Text>
            </TouchableOpacity>
          </View>

          {isNewUser && (
            <View className="bg-surface rounded-xl px-4 mb-4">
              <TextInput
                className="py-4 text-textPrimary text-base"
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center"
          >
            {loading ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={theme.background} />
                <Text className="text-background font-semibold text-base">
                  Dérivation des clés...
                </Text>
              </View>
            ) : (
              <Text className="text-background font-semibold text-base">
                {isNewUser ? 'Créer mon compte' : 'Se connecter'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
