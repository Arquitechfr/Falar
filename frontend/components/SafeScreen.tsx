import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface SafeScreenProps {
  children: ReactNode;
  className?: string;
}

export function SafeScreen({ children, className = '' }: SafeScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-background ${className}`}>
      {children}
    </SafeAreaView>
  );
}
