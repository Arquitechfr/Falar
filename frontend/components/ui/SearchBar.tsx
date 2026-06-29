import { useCallback, useState } from 'react';
import { View, TextInput, Pressable, TextStyle, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Search, X } from './Icons';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher',
  onFocus,
  onBlur,
  style,
}: SearchBarProps) {
  const { colors, radii } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const handleFocus = useCallback(() => {
    setFocused(true);
    borderColor.value = withTiming(colors.primary, { duration: 200 });
    onFocus?.();
  }, [borderColor, colors, onFocus]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    borderColor.value = withTiming(colors.border, { duration: 200 });
    onBlur?.();
  }, [borderColor, colors, onBlur]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const textInputStyle: TextStyle = {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  };

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
          borderRadius: radii.md,
          backgroundColor: colors.card,
          borderWidth: 1,
          paddingHorizontal: spacing.md,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={{ marginRight: spacing.sm }}>
        <Search size={18} color={colors.textSecondary} />
      </View>
      <TextInput
        style={textInputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <X size={16} color={colors.textSecondary} />
        </Pressable>
      )}
    </Animated.View>
  );
}
