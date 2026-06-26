import { View, Text } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
  avatarUrl?: string;
}

export function Avatar({ name, size = 48, avatarUrl }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <View
        className="bg-surface rounded-full items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <View className="w-full h-full bg-surface" />
      </View>
    );
  }

  return (
    <View
      className="bg-primary rounded-full items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text
        className="text-background font-semibold"
        style={{ fontSize: size * 0.35 }}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}
