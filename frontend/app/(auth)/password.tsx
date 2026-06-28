import { useState, useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deriveKeypair } from '@/features/crypto/keyDerivation';
import { verifyOtp } from '@/features/auth/authApi';
import { setTokens } from '@/services/api';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { registerForPushNotifications } from '@/services/notifications';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button, Input } from '@/components/ui';
import { Shield } from '@/components/ui/Icons';

export default function PasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ phone: string; code: string; isNewUser: string }>();
  const isNewUser = params.isNewUser === 'true';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    console.log('[PasswordScreen] handleSubmit called', { isNewUser, phone: params.phone, code: params.code });

    if (!password) {
      toast.show('Entrez un mot de passe', 'error');
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      toast.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (!params.phone || !params.code) {
      toast.show('Erreur: paramètres manquants', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('[PasswordScreen] deriving keypair...');
      const { privateKey, publicKey, publicKeyBase64 } = await deriveKeypair(
        password,
        params.phone,
      );
      console.log('[PasswordScreen] keypair derived, registering push...');

      const deviceToken = await registerForPushNotifications();
      console.log('[PasswordScreen] push registered, verifying OTP...');

      const result = await verifyOtp(
        params.phone,
        params.code,
        publicKeyBase64,
        deviceToken || undefined,
      );
      console.log('[PasswordScreen] OTP verified, saving tokens...');

      await setTokens(result.accessToken, result.refreshToken);
      useCryptoStore.getState().setKeys(privateKey, publicKey);
      useAuthStore.getState().login(result.user);

      router.replace('/(main)/conversations');
    } catch (err) {
      console.error('[PasswordScreen] error:', err);
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.show(msg || 'Échec de la vérification', 'error');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, isNewUser, params, toast, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            {isNewUser ? 'Créer un mot de passe' : 'Votre mot de passe'}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl }}>
            {isNewUser
              ? 'Ce mot de passe sert à dériver vos clés de chiffrement'
              : 'Entrez votre mot de passe pour dériver vos clés'}
          </Text>

          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType={isNewUser ? 'next' : 'go'}
              onSubmitEditing={!isNewUser ? handleSubmit : undefined}
            />

            {isNewUser && (
              <Input
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                error={confirmPassword && password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : undefined}
              />
            )}
          </View>

          <Button
            label={loading ? 'Dérivation des clés...' : isNewUser ? 'Créer mon compte' : 'Se connecter'}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: spacing.xl,
              paddingHorizontal: spacing.md,
            }}
          >
            <Shield size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center' }}>
              Vos clés de chiffrement ne quittent jamais votre appareil
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
