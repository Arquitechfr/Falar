import { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtp } from '@/features/auth/authApi';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button, PhoneInput } from '@/components/ui';
import { Phone as PhoneIcon, Shield } from '@/components/ui/Icons';
import type { Country } from '@/constants/countries';

export default function PhoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      toast.show('Numéro invalide. Vérifiez le pays et le numéro.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { isNewUser } = await sendOtp(phoneNumber);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: phoneNumber, isNewUser: String(isNewUser) },
      });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.show(msg || 'Échec de l\'envoi du code', 'error');
    } finally {
      setLoading(false);
    }
  }, [isValid, phoneNumber, router, toast]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <PhoneIcon size={32} color="#FFFFFF" />
            </View>
            <Text style={{ ...typography.display, color: colors.textPrimary }}>Falar</Text>
            <Text
              style={{
                ...typography.body,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}
            >
              Entrez votre numéro de téléphone pour commencer
            </Text>
          </View>

          <PhoneInput
            value={phoneNumber}
            onChangePhoneNumber={setPhoneNumber}
            onChangeValidity={setIsValid}
            style={{ marginBottom: spacing.lg }}
          />

          <Button
            label={loading ? 'Envoi...' : 'Recevoir le code'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isValid}
            fullWidth
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: spacing.xl,
            }}
          >
            <Shield size={14} color={colors.textSecondary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              Vos messages sont chiffrés de bout en bout
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
