import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; isNewUser: string }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  const handleSubmit = () => {
    if (!isComplete) return;
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
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6"
      >
        <View className="flex-1 justify-center">
          <Text className="text-2xl font-bold text-textPrimary mb-2">Vérification</Text>
          <Text className="text-textSecondary mb-8">
            Entrez le code à 6 chiffres envoyé au {params.phone}
          </Text>

          <View className="flex-row justify-between mb-8">
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { refs.current[i] = ref; }}
                className="w-12 h-14 bg-surface rounded-xl text-center text-textPrimary text-xl font-bold"
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isComplete || loading}
            className={`rounded-xl py-4 items-center ${isComplete ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text className="text-background font-semibold text-base">
              {loading ? 'Vérification...' : 'Vérifier'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={cooldown > 0}
            className="mt-4 items-center"
          >
            <Text className={`text-sm ${cooldown > 0 ? 'text-textSecondary' : 'text-primary'}`}>
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
