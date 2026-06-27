import { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, radius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = 0.3 + shimmer.value * 0.4;
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.secondaryBackground,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
