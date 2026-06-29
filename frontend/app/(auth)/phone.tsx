import { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtp } from '@/features/auth/authApi';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button, PhoneInput } from '@/components/ui';
import { Shield } from '@/components/ui/Icons';
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
      const { isNewUser, keySalt } = await sendOtp(phoneNumber);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: phoneNumber, isNewUser: String(isNewUser), keySalt: keySalt || '' },
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
            <Image
              source={require('@/assets/texte_logo.png')}
              style={{
                width: 180,
                height: 64,
                resizeMode: 'contain',
                marginBottom: spacing.lg,
              }}
            />
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
              marginTop: spacing.xl,
            }}
          >
            <View style={{ marginRight: 6 }}>
              <Shield size={14} color={colors.textSecondary} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              Vos messages sont chiffrés de bout en bout
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
