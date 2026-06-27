import { type ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';

export type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', size = 'md', icon, style }: BadgeProps) {
  const { colors } = useTheme();

  const variantColors: Record<BadgeVariant, string> = {
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    warning: colors.warning,
  };

  const bg = variantColors[variant];
  const height = size === 'sm' ? 18 : 22;
  const fontSize = size === 'sm' ? typography.micro.fontSize : typography.caption.fontSize;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: bg,
          borderRadius: height / 2,
          paddingHorizontal: size === 'sm' ? 6 : 8,
          height,
          minWidth: height,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          ...typography.micro,
          fontSize,
          color: '#FFFFFF',
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
