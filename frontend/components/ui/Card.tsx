import { type ReactNode } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { radii } from '@/constants/theme';
import { spacing } from '@/constants/spacing';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.8 };

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', onPress, padding = spacing.md, style }: CardProps) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    ...(variant === 'elevated' ? shadows.md : shadows.sm),
  };

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.98, SPRING_CONFIG); }}
          onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
          style={({ pressed }) => [
            baseStyle,
            { opacity: pressed ? 0.9 : 1 },
            style,
          ]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
