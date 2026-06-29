import { useEffect, useMemo, useCallback, useState, type ReactNode } from 'react';
import { View, Pressable, DimensionValue } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';

const SPRING_CONFIG = { damping: 24, stiffness: 280, mass: 0.8 };
const EXIT_DURATION = 250;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoint?: DimensionValue;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  snapPoint = '60%',
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: EXIT_DURATION });
      const timer = setTimeout(() => setShouldRender(false), EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [visible, translateY, backdropOpacity]);

  const stableOnClose = useCallback(onClose, [onClose]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > 120) {
            runOnJS(stableOnClose)();
          } else {
            translateY.value = withSpring(0, SPRING_CONFIG);
          }
        }),
    [stableOnClose, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!shouldRender) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.overlay,
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: snapPoint,
              backgroundColor: colors.card,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              paddingBottom: insets.bottom + spacing.sm,
            },
            sheetStyle,
          ]}
        >
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginTop: spacing.sm,
              marginBottom: spacing.md,
            }}
          />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
