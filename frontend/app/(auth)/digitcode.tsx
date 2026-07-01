import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpInput } from 'react-native-otp-entry';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { fromByteArray } from 'base64-js';
import { deriveKeypair } from '@/features/crypto/keyDerivation';
import { verifyOtp } from '@/features/auth/authApi';
import { setTokens, logger } from '@/services/api';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { registerForPushNotifications } from '@/services/notifications';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Shield } from '@/components/ui/Icons';

const PIN_LENGTH = 6;

export default function DigitCodeScreen() {
  const router = useRouter();
  const { colors, radii } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ phone: string; code: string; isNewUser: string; keySalt: string }>();
  const isNewUser = params.isNewUser === 'true';

  const keySalt = useMemo(() => {
    if (params.keySalt) return params.keySalt;
    if (isNewUser) return fromByteArray(Crypto.getRandomBytes(32));
    return '';
  }, [params.keySalt, isNewUser]);

  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  const handlePinFilled = useCallback((value: string) => {
    setPin(value);
    if (isNewUser) {
      setStep('confirm');
    }
  }, [isNewUser]);

  const handleConfirmPinFilled = useCallback((value: string) => {
    setConfirmPin(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    logger.log('[DigitCodeScreen] handleSubmit called', { isNewUser, phone: params.phone, code: params.code, step, pin, confirmPin });

    const activePin = step === 'confirm' ? confirmPin : pin;

    if (activePin.length !== PIN_LENGTH) {
      isSubmitting.current = false;
      toast.show('Entrez les 6 chiffres', 'error');
      return;
    }

    if (isNewUser && step === 'pin') {
      setStep('confirm');
      isSubmitting.current = false;
      return;
    }

    if (isNewUser && pin !== confirmPin) {
      isSubmitting.current = false;
      toast.show('Les codes ne correspondent pas', 'error');
      return;
    }

    if (!params.phone || !params.code) {
      isSubmitting.current = false;
      toast.show('Erreur: paramètres manquants', 'error');
      return;
    }

    setLoading(true);
    try {
      logger.log('[DigitCodeScreen] deriving keypair...');
      const { privateKey, publicKey, publicKeyBase64 } = await deriveKeypair(
        activePin,
        params.phone,
        keySalt,
      );
      logger.log('[DigitCodeScreen] keypair derived, registering push...');

      const deviceToken = await registerForPushNotifications();
      logger.log('[DigitCodeScreen] push registered, verifying OTP...');

      const result = await verifyOtp(
        params.phone,
        params.code,
        publicKeyBase64,
        deviceToken || undefined,
        keySalt,
      );
      logger.log('[DigitCodeScreen] OTP verified, saving tokens...');

      await setTokens(result.accessToken, result.refreshToken);

      try {
        await SecureStore.setItemAsync('falar_pin', activePin, {
          requireAuthentication: true,
          authenticationPrompt: 'Autorisez Falar à sauvegarder votre accès',
        });
      } catch {
        // Si l'utilisateur refuse la biométrie : pas bloquant, le PIN manuel reste disponible
      }

      useCryptoStore.getState().setKeys(privateKey, publicKey);
      useAuthStore.getState().login(result.user);

      router.replace('/(main)/conversations');
    } catch (err) {
      logger.error('[DigitCodeScreen] error:', err);
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.show(msg || 'Échec de la vérification', 'error');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }, [pin, confirmPin, step, isNewUser, params, toast, router, keySalt]);

  const title = isNewUser
    ? step === 'pin'
      ? 'Créer un code PIN'
      : 'Confirmer le code PIN'
    : 'Votre code PIN';

  const subtitle = isNewUser
    ? step === 'pin'
      ? 'Mémorisez-le bien, il protège vos messages.'
      : 'Entrez-le à nouveau pour confirmer'
    : 'Entrez votre code pour accéder à vos messages.';

  const activePin = step === 'confirm' ? confirmPin : pin;
  const isPinComplete = activePin.length === PIN_LENGTH;

  const theme = {
    containerStyle: styles.otpContainer,
    pinCodeContainerStyle: {
      width: 48,
      height: 56,
      borderRadius: radii.md,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    pinCodeTextStyle: {
      ...typography.heading,
      color: colors.textPrimary,
    },
    focusedPinCodeContainerStyle: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    filledPinCodeContainerStyle: {
      borderColor: colors.primary,
    },
  };

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
            {title}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl }}>
            {subtitle}
          </Text>

          <View style={{ marginBottom: spacing.lg }}>
            {step === 'pin' ? (
              <OtpInput
                numberOfDigits={PIN_LENGTH}
                type="numeric"
                secureTextEntry
                autoFocus
                focusColor={colors.primary}
                onTextChange={setPin}
                onFilled={handlePinFilled}
                blurOnFilled={isNewUser}
                theme={theme}
                textInputProps={{
                  accessibilityLabel: 'Code PIN',
                }}
              />
            ) : (
              <OtpInput
                numberOfDigits={PIN_LENGTH}
                type="numeric"
                secureTextEntry
                autoFocus
                focusColor={colors.primary}
                onTextChange={setConfirmPin}
                onFilled={handleConfirmPinFilled}
                theme={theme}
                textInputProps={{
                  accessibilityLabel: 'Confirmation du code PIN',
                }}
              />
            )}

            {isNewUser && step === 'confirm' && confirmPin.length === PIN_LENGTH && pin !== confirmPin && (
              <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.sm }}>
                Les codes ne correspondent pas
              </Text>
            )}
          </View>

          <Button
            label={loading ? 'Dérivation des clés...' : isNewUser ? 'Créer mon compte' : 'Se connecter'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isPinComplete || loading}
            fullWidth
          />

          {isNewUser && step === 'confirm' && (
            <Button
              label="Retour"
              variant="ghost"
              onPress={() => {
                setStep('pin');
                setConfirmPin('');
                setPin('');
              }}
              style={{ marginTop: spacing.md }}
            />
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: spacing.xl,
              paddingHorizontal: spacing.md,
            }}
          >
            <View style={{ marginRight: 6 }}>
              <Shield size={14} color={colors.textSecondary} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center' }}>
              Vos clés de chiffrement ne quittent jamais votre appareil
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
