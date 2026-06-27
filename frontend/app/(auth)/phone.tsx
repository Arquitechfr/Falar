import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtp } from '@/features/auth/authApi';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button, Input, BottomSheet } from '@/components/ui';
import { ChevronDown, Phone as PhoneIcon, Shield } from '@/components/ui/Icons';

const COUNTRY_CODES = [
  { code: '+33', label: 'France +33' },
  { code: '+32', label: 'Belgique +32' },
  { code: '+41', label: 'Suisse +41' },
  { code: '+1', label: 'Canada/USA +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+49', label: 'Allemagne +49' },
  { code: '+39', label: 'Italie +39' },
  { code: '+34', label: 'Espagne +34' },
  { code: '+31', label: 'Pays-Bas +31' },
  { code: '+212', label: 'Maroc +212' },
  { code: '+213', label: 'Algérie +213' },
  { code: '+221', label: 'Sénégal +221' },
  { code: '+225', label: "Côte d'Ivoire +225" },
];

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export default function PhoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const [countryCode, setCountryCode] = useState('+33');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fullPhone = `${countryCode}${phone}`;
  const isValid = E164_REGEX.test(fullPhone);

  const handleSubmit = async () => {
    if (!isValid) {
      toast.show('Numéro invalide. Format attendu: +33612345678', 'error');
      return;
    }

    setLoading(true);
    try {
      const { isNewUser } = await sendOtp(fullPhone);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: fullPhone, isNewUser: String(isNewUser) },
      });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.show(msg || 'Échec de l\'envoi du code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = useCallback((code: string) => {
    setCountryCode(code);
    setShowPicker(false);
  }, []);

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

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
                {countryCode}
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="6 12 34 56 78"
                keyboardType="phone-pad"
                leftIcon={<PhoneIcon size={20} color={colors.textSecondary} />}
              />
            </View>
          </View>

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

      <BottomSheet visible={showPicker} onClose={() => setShowPicker(false)} snapPoint="60%">
        <ScrollView>
          {COUNTRY_CODES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => selectCountry(c.code)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
              })}
            >
              <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
                {c.label}
              </Text>
              {countryCode === c.code && (
                <Text style={{ ...typography.bodyMedium, color: colors.primary }}>✓</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
