import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtp } from '@/features/auth/authApi';
import { theme } from '@/constants/theme';

const COUNTRY_CODES = [
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+1', label: '🇨🇦 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+39', label: '🇮🇹 +39' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+31', label: '🇳🇱 +31' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+213', label: '🇩🇿 +213' },
  { code: '+221', label: '🇸🇳 +221' },
  { code: '+225', label: '🇨🇮 +225' },
];

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export default function PhoneScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+33');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fullPhone = `${countryCode}${phone}`;
  const isValid = E164_REGEX.test(fullPhone);

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Erreur', 'Numéro invalide. Format attendu: +33612345678');
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
      Alert.alert('Erreur', msg || 'Échec de l\'envoi du code');
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
          <Text className="text-3xl font-bold text-textPrimary mb-2">Falar</Text>
          <Text className="text-textSecondary mb-8">
            Entrez votre numéro de téléphone pour commencer
          </Text>

          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setShowPicker(!showPicker)}
              className="bg-surface rounded-xl px-4 py-4 justify-center"
            >
              <Text className="text-textPrimary text-base">{countryCode}</Text>
            </TouchableOpacity>

            <TextInput
              className="flex-1 bg-surface rounded-xl px-4 py-4 text-textPrimary text-base"
              placeholder="6 12 34 56 78"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
          </View>

          {showPicker && (
            <View className="bg-surface rounded-xl mb-4 max-h-48">
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => {
                    setCountryCode(c.code);
                    setShowPicker(false);
                  }}
                  className="px-4 py-3 border-b border-background"
                >
                  <Text className="text-textPrimary">{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || loading}
            className={`rounded-xl py-4 items-center ${isValid && !loading ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text className="text-background font-semibold text-base">
              {loading ? 'Envoi...' : 'Recevoir le code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
