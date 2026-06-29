import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AvatarProps {
  name: string;
  size?: number;
  avatarUrl?: string;
  online?: boolean;
}

export function Avatar({ name, size = 48, avatarUrl, online = false }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.secondaryBackground,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <View style={{ width: '100%', height: '100%', backgroundColor: colors.secondaryBackground }} />
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: size * 0.35,
            color: colors.background,
            fontWeight: '600',
          }}
        >
          {initials || '?'}
        </Text>
      </View>
      {online && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: (size * 0.25) / 2,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        />
      )}
    </View>
  );
}
