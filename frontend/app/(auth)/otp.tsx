import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const INPUT_SIZE = 52;

export default function OtpScreen() {
  const router = useRouter();
  const { colors, radii } = useTheme();
  const params = useLocalSearchParams<{ phone: string; isNewUser: string }>();

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
    if (value.length > 1) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handleKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, [digits]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  const handleSubmit = useCallback(() => {
    if (!isComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    router.push({
      pathname: '/(auth)/password',
      params: {
        phone: params.phone,
        code,
        isNewUser: params.isNewUser,
      },
    });
    setLoading(false);
  }, [isComplete, code, params, router]);

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
            label={loading ? 'Vérification...' : 'Vérifier'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isComplete}
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
