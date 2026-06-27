import { View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface SafeScreenProps {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  className?: string;
}

export function SafeScreen({ children, edges, style, className = '' }: SafeScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      className={className}
    >
      {children}
    </SafeAreaView>
  );
}
