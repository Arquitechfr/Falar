import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

const DOT_SIZE = 7;
const DURATION = 500;
const DELAY = 180;

function TypingDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) })),
        withTiming(0.3, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    translateY.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(-3, { duration: DURATION, easing: Easing.inOut(Easing.ease) })),
        withTiming(0, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [opacity, translateY, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: colors.textSecondary,
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingIndicator() {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bubbleOther,
          borderRadius: 14,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.sm + 2,
        }}
      >
        <View style={{ marginRight: 4 }}><TypingDot delay={0} /></View>
        <View style={{ marginRight: 4 }}><TypingDot delay={DELAY} /></View>
        <TypingDot delay={DELAY * 2} />
      </View>
    </View>
  );
}
