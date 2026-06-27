import { useCallback, type ReactNode } from 'react';
import { View, Pressable, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';

interface TabRoute {
  key: string;
  name: string;
}

interface TabDescriptor {
  options: {
    title?: string;
    href?: string | null;
    tabBarIcon?: (props: { color: string; size: number }) => ReactNode;
  };
}

interface BottomTabBarProps {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, TabDescriptor>;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
  };
  style?: ViewStyle;
}

const SPRING_CONFIG = { damping: 15, stiffness: 300 };

function TabItem({
  route,
  isFocused,
  descriptor,
  onPress,
}: {
  route: TabRoute;
  isFocused: boolean;
  descriptor: TabDescriptor;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const label = descriptor.options.title ?? route.name;
  const Icon = descriptor.options.tabBarIcon;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingTop: spacing.sm + 4,
        paddingBottom: spacing.sm,
      }}
    >
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        {Icon && Icon({ color: isFocused ? colors.primary : colors.textSecondary, size: 24 })}
        <Text
          style={{
            ...typography.micro,
            color: isFocused ? colors.primary : colors.textSecondary,
            marginTop: 4,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BottomTabBar({ state, descriptors, navigation, style }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (route: TabRoute) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name);
      }
    },
    [navigation],
  );

  const visibleRoutes = state.routes.filter(
    (route) => descriptors[route.key]?.options?.tabBarIcon != null,
  );

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === index}
            descriptor={descriptors[route.key]}
            onPress={() => handlePress(route)}
          />
        );
      })}
    </View>
  );
}
