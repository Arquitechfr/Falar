import { View, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface LoaderProps {
  size?: 'small' | 'large';
  fullscreen?: boolean;
  color?: string;
  style?: ViewStyle;
}

export function Loader({ size = 'small', fullscreen = false, color, style }: LoaderProps) {
  const { colors } = useTheme();

  if (fullscreen) {
    return (
      <View
        style={[
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        <ActivityIndicator size="large" color={color || colors.primary} />
      </View>
    );
  }

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', padding: 16 }, style]}>
      <ActivityIndicator size={size} color={color || colors.primary} />
    </View>
  );
}
