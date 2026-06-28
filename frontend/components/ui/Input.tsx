import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { View, TextInput, Text, Pressable, TextStyle, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Eye, EyeOff } from './Icons';

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  style?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  leftIcon,
  rightIcon,
  autoFocus,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  autoCapitalize = 'none',
  maxLength,
  style,
}: InputProps) {
  const { colors, radii } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = useSharedValue(colors.border);
  const borderWidth = useSharedValue(1);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  useEffect(() => {
    if (error) {
      borderColor.value = withTiming(colors.danger, { duration: 200 });
      borderWidth.value = withTiming(1.5, { duration: 200 });
    } else if (focused) {
      borderColor.value = withTiming(colors.primary, { duration: 200 });
      borderWidth.value = withTiming(1.5, { duration: 200 });
    } else {
      borderColor.value = withTiming(colors.border, { duration: 200 });
      borderWidth.value = withTiming(1, { duration: 200 });
    }
  }, [error, focused, borderColor, borderWidth, colors]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    borderWidth: borderWidth.value,
  }));

  const inputHeight = 56;

  const containerStyle: ViewStyle = {
    height: inputHeight,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  };

  const textInputStyle: TextStyle = {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    height: '100%',
  };

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ ...typography.captionMedium, color: colors.textSecondary, marginLeft: spacing.xs }}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          containerStyle,
          animatedStyle,
          style,
        ]}
      >
        {leftIcon && <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>}
        <TextInput
          style={textInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            {showPassword ? (
              <Eye size={20} color={colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
        {rightIcon && <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View>}
      </Animated.View>
      {error && (
        <Text style={{ ...typography.caption, color: colors.danger, marginLeft: spacing.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
}
