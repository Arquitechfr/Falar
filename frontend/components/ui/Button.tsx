import { useCallback, type ReactNode } from 'react';
import { Pressable, ActivityIndicator, TextStyle, ViewStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  haptic?: boolean;
  style?: ViewStyle;
}

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptic = true,
  style,
}: ButtonProps) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    scale.value = withSpring(0.97, SPRING_CONFIG);
  }, [isDisabled, scale]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [isDisabled, scale]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [isDisabled, haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(isDisabled ? 0.5 : 1, { duration: 150 }),
  }));

  const height = size === 'lg' ? 56 : 48;
  const fontSize = size === 'lg' ? typography.bodyMedium.fontSize : typography.captionMedium.fontSize;

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string | undefined }> = {
    primary: { bg: colors.primary, text: '#FFFFFF', border: undefined },
    secondary: { bg: colors.secondaryBackground, text: colors.textPrimary, border: colors.border },
    ghost: { bg: 'transparent', text: colors.primary, border: undefined },
    danger: { bg: colors.danger, text: '#FFFFFF', border: undefined },
  };

  const vs = variantStyles[variant];

  const textStyle: TextStyle = {
    ...typography.bodyMedium,
    fontSize,
    color: vs.text,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        {
          height,
          borderRadius: 14,
          backgroundColor: vs.bg,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          ...(variant === 'primary' ? shadows.fab : shadows.sm),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Animated.Text style={textStyle}>{label}</Animated.Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </AnimatedPressable>
  );
}
