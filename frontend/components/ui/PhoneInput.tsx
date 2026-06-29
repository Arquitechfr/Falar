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
  const [isFocused, setIsFocused] = useState(false);
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
      const parsed = parsePhoneNumberFromString(fullNumber, { defaultCountry: c.iso2 as any });
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
            alignItems: 'center',
            height: 56,
            borderRadius: radii.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: isFocused ? colors.primary : colors.border,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
      >
        {/* Country picker button */}
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexShrink: 0,
              minWidth: 90,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 4 }}>{country.flag}</Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                ...typography.bodyMedium,
                color: colors.textPrimary,
                marginRight: 4,
              }}
            >
              {country.dialCode}
            </Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </View>
        </Pressable>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: 24,
            backgroundColor: colors.border,
            marginHorizontal: spacing.sm,
          }}
        />

        {/* Phone number input */}
        <TextInput
          ref={inputRef}
          value={nationalNumber}
          onChangeText={handleTextChange}
          placeholder={country.format}
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            height: 56,
            ...typography.body,
            color: colors.textPrimary,
          }}
        />
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
              backgroundColor: colors.secondaryBackground,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              height: 44,
            }}
          >
            <View style={{ marginRight: spacing.sm }}>
              <SearchIcon size={18} color={colors.textSecondary} />
            </View>
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
          {filteredCountries.map((item) => (
            <Pressable
              key={item.iso2}
              onPress={() => handleSelectCountry(item)}
              style={({ pressed }) => ({
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: spacing.md }}>{item.flag}</Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    ...typography.body,
                    color: colors.textPrimary,
                    flex: 1,
                    marginRight: spacing.md,
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    ...typography.bodyMedium,
                    color: colors.textSecondary,
                    marginRight: spacing.md,
                  }}
                >
                  {item.dialCode}
                </Text>
                {country.iso2 === item.iso2 && (
                  <Check size={18} color={colors.primary} />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
