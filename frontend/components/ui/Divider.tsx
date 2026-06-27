import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  inset?: number;
  style?: ViewStyle;
}

export function Divider({ orientation = 'horizontal', inset = 0, style }: DividerProps) {
  const { colors } = useTheme();

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          {
            width: 0.5,
            alignSelf: 'stretch',
            backgroundColor: colors.border,
            marginVertical: inset,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: 0.5,
          backgroundColor: colors.border,
          marginHorizontal: inset,
        },
        style,
      ]}
    />
  );
}
