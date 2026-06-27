import { type ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.secondaryBackground,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
          }}
        >
          {icon}
        </View>
      )}
      <Text
        style={{ ...typography.title, color: colors.textPrimary, textAlign: 'center' }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="md" />
      )}
    </View>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  const { colors } = useTheme();

  return (
    <EmptyState
      icon={
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.textSecondary, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 2, height: 20, backgroundColor: colors.textSecondary, transform: [{ rotate: '45deg' }] }} />
        </View>
      }
      title="Pas de connexion"
      description="Vérifiez votre connexion internet et réessayez."
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { colors } = useTheme();

  return (
    <EmptyState
      icon={
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>!</Text>
        </View>
      }
      title="Erreur serveur"
      description="Une erreur est survenue. Veuillez réessayer."
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}
