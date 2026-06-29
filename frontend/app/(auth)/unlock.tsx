import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { OtpInput } from 'react-native-otp-entry';
import { deriveKeypair } from '@/features/crypto/keyDerivation';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Shield } from '@/components/ui/Icons';

const PIN_LENGTH = 6;
const PIN_SECURE_STORE_KEY = 'falar_pin';

export default function UnlockScreen() {
  const router = useRouter();
  const { colors, radii } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const isSubmitting = useRef(false);
  const pinRef = useRef('');

  const user = useAuthStore((s) => s.user);

  const unlock = useCallback(async (resolvedPin: string) => {
    if (!user?.phone || !resolvedPin) return;

    try {
      const { privateKey, publicKey, publicKeyBase64 } = await deriveKeypair(
        resolvedPin,
        user.phone,
        user.keySalt ?? undefined,
      );

      if (publicKeyBase64 !== user.publicKey) {
        toast.show('Code PIN incorrect', 'error');
        return;
      }

      useCryptoStore.getState().setKeys(privateKey, publicKey);
      router.replace('/(main)/conversations');
    } catch {
      toast.show('Erreur lors du déverrouillage', 'error');
    }
  }, [user, router, toast]);

  // Tentative biométrie au montage
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          if (!cancelled) setShowPin(true);
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Déverrouillez Falar',
          fallbackLabel: 'Utiliser le code',
          cancelLabel: 'Annuler',
          disableDeviceFallback: false,
        });

        if (cancelled) return;

        if (result.success) {
          const storedPin = await SecureStore.getItemAsync('falar_pin', {
            requireAuthentication: true,
            authenticationPrompt: 'Déverrouillez Falar',
          });

          if (storedPin) {
            setLoading(true);
            await unlock(storedPin);
            setLoading(false);
          } else {
            setShowPin(true);
          }
        } else {
          setShowPin(true);
        }
      } catch {
        if (!cancelled) setShowPin(true);
      }
    })();

    return () => { cancelled = true; };
  }, [unlock]);

  const handlePinFilled = useCallback((value: string) => {
    setPin(value);
    pinRef.current = value;
  }, []);

  const handleUnlock = useCallback(async () => {
    if (isSubmitting.current) return;
    const currentPin = pinRef.current;
    if (currentPin.length !== PIN_LENGTH) return;

    isSubmitting.current = true;
    setLoading(true);
    await unlock(currentPin);
    setLoading(false);
    isSubmitting.current = false;
  }, [unlock]);

  const theme = {
    pinCodeContainerStyle: {
      width: 48,
      height: 56,
      borderRadius: radii.md,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    pinCodeTextStyle: { ...typography.heading, color: colors.textPrimary },
    focusedPinCodeContainerStyle: { borderColor: colors.primary, borderWidth: 2 },
    filledPinCodeContainerStyle: { borderColor: colors.primary },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Déverrouiller Falar
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl }}>
            {showPin
              ? 'Entrez votre code pour accéder à vos messages.'
              : 'Vérification en cours...'}
          </Text>

          {showPin && (
            <>
              <View style={{ marginBottom: spacing.lg }}>
                <OtpInput
                  numberOfDigits={PIN_LENGTH}
                  type="numeric"
                  secureTextEntry
                  autoFocus
                  focusColor={colors.primary}
                  onTextChange={setPin}
                  onFilled={handlePinFilled}
                  theme={theme}
                  textInputProps={{ accessibilityLabel: 'Code PIN' }}
                />
              </View>

              <Button
                label={loading ? 'Déverrouillage...' : 'Déverrouiller'}
                onPress={handleUnlock}
                loading={loading}
                disabled={pin.length !== PIN_LENGTH || loading}
                fullWidth
              />
            </>
          )}

          {loading && !showPin && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>
                Déverrouillage...
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl }}>
            <Shield size={14} color={colors.textSecondary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 6 }}>
              Vos clés ne quittent jamais votre appareil
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
