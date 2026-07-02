import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { List } from 'react-native-paper';
import { OtpInput } from 'react-native-otp-entry';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { fromByteArray } from 'base64-js';
import { x25519 } from '@noble/curves/ed25519.js';
import { SafeScreen } from '@/components/SafeScreen';
import { ScreenHeader, Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/authStore';
import { updateMe } from '@/features/users/usersApi';
import { deriveKeypair } from '@/features/crypto/keyDerivation';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { logger } from '@/services/api';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Shield, Trash } from '@/components/ui/Icons';

const PIN_LENGTH = 6;
const PRIVATE_KEY_STORAGE = 'falar_private_key';
const KEY_SALT_STORAGE = 'falar_key_salt';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, radii } = useTheme();
  const toast = useToast();
  const { user } = useAuth();

  const [mode, setMode] = useState<'overview' | 'setPin' | 'removePin'>('overview');
  const [pinStep, setPinStep] = useState<'pin' | 'confirm'>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    (async () => {
      const salt = await SecureStore.getItemAsync(KEY_SALT_STORAGE);
      setHasPin(!!salt);
    })();
  }, []);

  const otpTheme = {
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

  const handleSetPin = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      toast.show('Entrez les 6 chiffres', 'error');
      return;
    }

    if (pinStep === 'pin') {
      setPinStep('confirm');
      return;
    }

    if (pin !== confirmPin) {
      toast.show('Les codes ne correspondent pas', 'error');
      return;
    }

    setLoading(true);
    try {
      const newKeySalt = fromByteArray(Crypto.getRandomBytes(32));
      const phone = user?.phone || '';
      logger.log('[Security] deriving new keypair with PIN...');
      const { privateKey, publicKey, publicKeyBase64 } = await deriveKeypair(pin, phone, newKeySalt);

      await updateMe({ publicKey: publicKeyBase64, keySalt: newKeySalt });
      await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, fromByteArray(privateKey));
      await SecureStore.setItemAsync(KEY_SALT_STORAGE, newKeySalt);

      useCryptoStore.getState().setKeys(privateKey, publicKey);
      if (user) {
        useAuthStore.getState().login({ ...user, publicKey: publicKeyBase64, keySalt: newKeySalt });
      }

      toast.show('Code PIN configuré', 'success');
      setHasPin(true);
      setMode('overview');
      setPin('');
      setConfirmPin('');
      setPinStep('pin');
    } catch (err) {
      logger.error('[Security] set PIN error:', err);
      toast.show('Échec de la configuration du PIN', 'error');
    } finally {
      setLoading(false);
    }
  }, [pin, confirmPin, pinStep, user, toast]);

  const handleRemovePin = useCallback(async () => {
    setLoading(true);
    try {
      const randomKey = Crypto.getRandomBytes(32);
      const publicKey = x25519.getPublicKey(randomKey);
      const publicKeyBase64 = fromByteArray(publicKey);

      await updateMe({ publicKey: publicKeyBase64, keySalt: '' });
      await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, fromByteArray(randomKey));
      await SecureStore.deleteItemAsync(KEY_SALT_STORAGE);

      useCryptoStore.getState().setKeys(randomKey, publicKey);
      if (user) {
        useAuthStore.getState().login({ ...user, publicKey: publicKeyBase64, keySalt: '' });
      }

      toast.show('Code PIN supprimé', 'success');
      setHasPin(false);
      setMode('overview');
    } catch (err) {
      logger.error('[Security] remove PIN error:', err);
      toast.show('Échec de la suppression du PIN', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const iconBg = (icon: React.ReactNode) => (
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {icon}
    </View>
  );

  if (mode === 'setPin') {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title={hasPin ? 'Modifier le PIN' : 'Définir un PIN'} onBack={() => { setMode('overview'); setPin(''); setConfirmPin(''); setPinStep('pin'); }} showBack />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm }}>
              {pinStep === 'pin' ? 'Créer un code PIN' : 'Confirmer le code PIN'}
            </Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl }}>
              {pinStep === 'pin'
                ? 'Ce PIN protège vos clés de chiffrement et permet de les récupérer sur un nouvel appareil.'
                : 'Entrez-le à nouveau pour confirmer'}
            </Text>

            <View style={{ marginBottom: spacing.lg }}>
              {pinStep === 'pin' ? (
                <OtpInput
                  numberOfDigits={PIN_LENGTH}
                  type="numeric"
                  secureTextEntry
                  autoFocus
                  focusColor={colors.primary}
                  onTextChange={setPin}
                  onFilled={(v) => { setPin(v); setPinStep('confirm'); }}
                  theme={otpTheme}
                  textInputProps={{ accessibilityLabel: 'Code PIN' }}
                />
              ) : (
                <OtpInput
                  numberOfDigits={PIN_LENGTH}
                  type="numeric"
                  secureTextEntry
                  autoFocus
                  focusColor={colors.primary}
                  onTextChange={setConfirmPin}
                  onFilled={setConfirmPin}
                  theme={otpTheme}
                  textInputProps={{ accessibilityLabel: 'Confirmation du code PIN' }}
                />
              )}

              {pinStep === 'confirm' && confirmPin.length === PIN_LENGTH && pin !== confirmPin && (
                <Text style={{ ...typography.caption, color: colors.danger, marginTop: spacing.sm }}>
                  Les codes ne correspondent pas
                </Text>
              )}
            </View>

            <Button
              label={loading ? 'Configuration...' : 'Confirmer'}
              onPress={handleSetPin}
              loading={loading}
              disabled={(pinStep === 'pin' ? pin.length : confirmPin.length) !== PIN_LENGTH || loading}
              fullWidth
            />

            {pinStep === 'confirm' && (
              <Button
                label="Retour"
                variant="ghost"
                onPress={() => { setPinStep('pin'); setConfirmPin(''); setPin(''); }}
                style={{ marginTop: spacing.md }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    );
  }

  if (mode === 'removePin') {
    return (
      <SafeScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Supprimer le PIN" onBack={() => setMode('overview')} showBack />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xxl }}
        >
          <View style={{ backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ marginRight: spacing.sm }}>
                <Trash size={24} color={colors.danger} />
              </View>
              <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                Supprimer le code PIN ?
              </Text>
            </View>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>
              Vos clés de chiffrement seront régénérées aléatoirement. Vous ne pourrez plus récupérer vos messages sur un nouvel appareil avec un PIN. Vos conversations existantes resteront accessibles sur cet appareil.
            </Text>
          </View>

          <Button
            label={loading ? 'Suppression...' : 'Supprimer le PIN'}
            onPress={handleRemovePin}
            loading={loading}
            disabled={loading}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Sécurité" onBack={() => router.back()} showBack />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            CHIFFREMENT
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ marginRight: spacing.sm }}>
                <Shield size={18} color={colors.success} />
              </View>
              <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>
                Vos messages sont chiffrés de bout en bout. Vos clés ne quittent jamais votre appareil.
              </Text>
            </View>
          </View>
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: colors.textSecondary, fontFamily: 'Outfit_500Medium', fontSize: 13, letterSpacing: 0.5 }}>
            CODE PIN
          </List.Subheader>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' }}>
            <List.Item
              title={hasPin ? 'Modifier le code PIN' : 'Définir un code PIN'}
              description={hasPin ? 'PIN configuré — récupération possible sur un nouvel appareil' : 'Protégez vos clés et permettez la récupération sur un nouvel appareil'}
              descriptionStyle={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 13 }}
              titleStyle={{ color: colors.textPrimary, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
              left={() => iconBg(<Shield size={20} color={colors.primary} />)}
              onPress={() => { setPin(''); setConfirmPin(''); setPinStep('pin'); setMode('setPin'); }}
              style={{ paddingVertical: spacing.sm }}
            />
            {hasPin && (
              <>
                <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />
                <List.Item
                  title="Supprimer le code PIN"
                  titleStyle={{ color: colors.danger, fontFamily: 'Outfit_400Regular', fontSize: 16 }}
                  left={() => iconBg(<Trash size={20} color={colors.danger} />)}
                  onPress={() => setMode('removePin')}
                  style={{ paddingVertical: spacing.sm }}
                />
              </>
            )}
          </View>
        </List.Section>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
