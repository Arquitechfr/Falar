import { useRef } from 'react';
import { View, Text, Image, Pressable, ViewStyle } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  size?: number;
  avatarUrl?: string;
  online?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = { sm: 32, md: 48, lg: 64, xl: 96 };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = SIZE_MAP.md,
  avatarUrl,
  online = false,
  onPress,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const initials = getInitials(name);
  const fontSize = size * 0.36;
  const dotSize = Math.max(8, size * 0.18);
  const gradientId = useRef(`avatar-${Math.random().toString(36).slice(2, 10)}`).current;

  const content = (
    <View style={{ width: size, height: size, ...style }}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.secondaryBackground,
          }}
        />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primaryLight} />
                <Stop offset="1" stopColor={colors.primaryDark} />
              </LinearGradient>
            </Defs>
            <Rect width={size} height={size} fill={`url(#${gradientId})`} />
          </Svg>
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                ...typography.subtitle,
                fontSize,
                color: '#FFFFFF',
                fontWeight: '600',
              }}
            >
              {initials}
            </Text>
          </View>
        </View>
      )}
      {online && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
