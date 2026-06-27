import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ViewStyle } from 'react-native';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { BottomSheet } from './BottomSheet';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { ChevronDown, Search as SearchIcon, Check } from './Icons';

export interface PhoneInputProps {
  value: string;
  onChangePhoneNumber: (e164: string) => void;
  onChangeValidity: (isValid: boolean) => void;
  onChangeCountry?: (country: Country) => void;
  defaultCountry?: Country;
  style?: ViewStyle;
}

export function PhoneInput({
  value,
  onChangePhoneNumber,
  onChangeValidity,
  onChangeCountry,
  defaultCountry = DEFAULT_COUNTRY,
  style,
}: PhoneInputProps) {
  const { colors } = useTheme();
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q),
    );
  }, [search]);

  const validateAndEmit = useCallback(
    (national: string, c: Country) => {
      const fullNumber = `${c.dialCode}${national}`;
      const parsed = parsePhoneNumberFromString(fullNumber, c.iso2);
      const isValid = parsed?.isValid() ?? false;
      onChangePhoneNumber(isValid ? parsed!.format('E.164') : fullNumber);
      onChangeValidity(isValid);
    },
    [onChangePhoneNumber, onChangeValidity],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^\d\s]/g, '');
      const formatter = new AsYouType(country.iso2 as any);
      const formatted = formatter.input(`${country.dialCode}${cleaned}`);
      const national = formatted.startsWith(country.dialCode)
        ? formatted.slice(country.dialCode.length).trim()
        : cleaned.trim();

      setNationalNumber(national);
      validateAndEmit(national.replace(/\s/g, ''), country);
    },
    [country, validateAndEmit],
  );

  const handleSelectCountry = useCallback(
    (c: Country) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCountry(c);
      setShowPicker(false);
      setSearch('');
      setNationalNumber('');
      onChangeCountry?.(c);
      validateAndEmit('', c);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [onChangeCountry, validateAndEmit],
  );

  return (
    <>
      <View
        style={[
          {
            flexDirection: 'row',
            gap: spacing.sm,
          },
          style,
        ]}
      >
        {/* Country picker button */}
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: radii.md,
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
          <Text style={{ fontSize: 22 }}>{country.flag}</Text>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
            {country.dialCode}
          </Text>
          <ChevronDown size={14} color={colors.textSecondary} />
        </Pressable>

        {/* Phone number input */}
        <View style={{ flex: 1 }}>
          <TextInput
            ref={inputRef}
            value={nationalNumber}
            onChangeText={handleTextChange}
            placeholder={country.format}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            autoCorrect={false}
            style={{
              height: 56,
              borderRadius: radii.md,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              ...typography.body,
              color: colors.textPrimary,
            }}
          />
        </View>
      </View>

      {/* Country picker bottom sheet */}
      <BottomSheet visible={showPicker} onClose={() => setShowPicker(false)} snapPoint="70%">
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <Text style={{ ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md }}>
            Sélectionner un pays
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.secondaryBackground,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              height: 44,
            }}
          >
            <SearchIcon size={18} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un pays"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              style={{ flex: 1, ...typography.body, color: colors.textPrimary }}
            />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {filteredCountries.map((item, index) => (
            <Pressable
              key={item.iso2}
              onPress={() => handleSelectCountry(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                gap: spacing.md,
                backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
              })}
            >
              <Text style={{ fontSize: 24 }}>{item.flag}</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
                {item.name}
              </Text>
              <Text style={{ ...typography.bodyMedium, color: colors.textSecondary }}>
                {item.dialCode}
              </Text>
              {country.iso2 === item.iso2 && (
                <Check size={18} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
