import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';

const SPRING_CONFIG = { damping: 24, stiffness: 280, mass: 0.8 };
const EXIT_DURATION = 200;

export interface ActionSheetItem {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetItem[];
}

export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(400, { duration: EXIT_DURATION });
      const timer = setTimeout(() => setShouldRender(false), EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!shouldRender) return null;

  const handlePress = (action: ActionSheetItem) => {
    action.onPress();
    onClose();
  };

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

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.card,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingBottom: insets.bottom + spacing.sm,
          },
          sheetStyle,
        ]}
      >
        {title && (
          <Text
            style={{
              ...typography.captionMedium,
              color: colors.textSecondary,
              textAlign: 'center',
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
            }}
          >
            {title}
          </Text>
        )}
        <ScrollView>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              onPress={() => handlePress(action)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
              })}
            >
              <View style={{ marginRight: spacing.md }}>{action.icon}</View>
              <Text
                style={{
                  ...typography.bodyMedium,
                  color: action.destructive ? colors.danger : colors.textPrimary,
                  flex: 1,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View
          style={{
            height: 0.5,
            backgroundColor: colors.border,
            marginVertical: spacing.sm,
          }}
        />
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: pressed ? colors.secondaryBackground : 'transparent',
            alignItems: 'center',
          })}
        >
          <Text style={{ ...typography.bodyMedium, color: colors.textSecondary }}>
            Annuler
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
