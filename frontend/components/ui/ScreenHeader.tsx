import { type ReactNode, Children } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { ChevronLeft } from './Icons';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: ReactNode;
  showBack?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightActions,
  showBack = true,
  style,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.card,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            height: 56,
            paddingHorizontal: spacing.sm,
          },
          style,
        ]}
      >
        {showBack && onBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...typography.subtitle, color: colors.textPrimary }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{ ...typography.caption, color: colors.textSecondary }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {rightActions && (
          <View style={{ flexDirection: 'row' }}>
            {Children.map(rightActions, (child, index) => (
              <View key={index} style={{ marginLeft: index > 0 ? spacing.sm : 0 }}>
                {child}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
