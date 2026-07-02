import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { fromByteArray } from 'base64-js';
import { x25519 } from '@noble/curves/ed25519.js';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { verifyOtp, extractApiError } from '@/features/auth/authApi';
import { setTokens, logger } from '@/services/api';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';
import { registerForPushNotifications } from '@/services/notifications';
import { useToast } from '@/components/ui/Toast';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const INPUT_SIZE = 52;
const PRIVATE_KEY_STORAGE = 'falar_private_key';

export default function OtpScreen() {
  const router = useRouter();
  const { colors, radii } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ phone: string; isNewUser: string; keySalt: string }>();
  const isNewUser = params.isNewUser === 'true';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '');

    if (digit.length > 1) {
      const pasted = digit.slice(0, OTP_LENGTH).split('');
      setDigits(prev => {
        const next = [...prev];
        for (let i = 0; i < pasted.length && index + i < OTP_LENGTH; i++) {
          next[index + i] = pasted[i];
        }
        return next;
      });
      const lastFilled = Math.min(index + pasted.length, OTP_LENGTH - 1);
      refs.current[lastFilled]?.focus();
      return;
    }

    setDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, [digits]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH && !digits.includes('');

  const handleSubmit = useCallback(async () => {
    if (!isComplete || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const storedKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
      const keySalt = params.keySalt || '';

      if (storedKey) {
        const privateKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
        const publicKey = x25519.getPublicKey(privateKey);
        const publicKeyBase64 = fromByteArray(publicKey);

        logger.log('[OTP] Existing key found, verifying...');
        const deviceToken = await registerForPushNotifications();
        const result = await verifyOtp(params.phone, code, publicKeyBase64, deviceToken || undefined, keySalt);

        await setTokens(result.accessToken, result.refreshToken);
        useCryptoStore.getState().setKeys(privateKey, publicKey);
        useAuthStore.getState().login(result.user);
        router.replace('/(main)/conversations');
      } else if (!isNewUser && keySalt) {
        router.push({
          pathname: '/(auth)/digitcode',
          params: { phone: params.phone, code, isNewUser: 'false', keySalt, mode: 'restore' },
        });
      } else {
        const randomKey = Crypto.getRandomBytes(32);
        const publicKey = x25519.getPublicKey(randomKey);
        const publicKeyBase64 = fromByteArray(publicKey);

        await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, fromByteArray(randomKey));

        logger.log('[OTP] New key generated, verifying...');
        const deviceToken = await registerForPushNotifications();
        const result = await verifyOtp(params.phone, code, publicKeyBase64, deviceToken || undefined, keySalt);

        await setTokens(result.accessToken, result.refreshToken);
        useCryptoStore.getState().setKeys(randomKey, publicKey);
        useAuthStore.getState().login(result.user);
        router.replace('/(main)/conversations');
      }
    } catch (err) {
      logger.error('[OTP] verification error:', err);
      toast.show(extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [isComplete, loading, code, params, router, toast, isNewUser]);

  const handleResend = useCallback(() => {
    if (cooldown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCooldown(RESEND_COOLDOWN);
  }, [cooldown]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Vérification
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl }}>
            Entrez le code à 6 chiffres envoyé au{'\n'}
            <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>{params.phone}</Text>
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
            {digits.map((digit, i) => {
              const isFocused = focusedIndex === i;
              const hasValue = digit !== '';
              return (
                <TextInput
                  key={i}
                  ref={(ref) => { refs.current[i] = ref; }}
                  style={[
                    styles.input,
                    {
                      width: INPUT_SIZE,
                      height: INPUT_SIZE,
                      borderRadius: radii.md,
                      backgroundColor: colors.card,
                      color: colors.textPrimary,
                      borderColor: isFocused ? colors.primary : hasValue ? colors.border : colors.border,
                      borderWidth: isFocused ? 2 : 1,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(null)}
                  onChangeText={(v) => handleChange(i, v)}
                  onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
                />
              );
            })}
          </View>

          <Button
            label={loading ? 'Vérification...' : isNewUser ? 'Créer mon compte' : 'Se connecter'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isComplete || loading}
            fullWidth
          />

          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0}
            style={{ alignItems: 'center', marginTop: spacing.lg }}
          >
            <Text
              style={{
                ...typography.captionMedium,
                color: cooldown > 0 ? colors.textSecondary : colors.primary,
              }}
            >
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
});
