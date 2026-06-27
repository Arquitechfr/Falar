import { type ReactNode } from 'react';
import { Modal as RNModal, View, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { radii } from '@/constants/theme';
import { X } from './Icons';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, onClose, title, children, style }: ModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        <View
          style={[
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.lg,
              width: '100%',
              maxWidth: 400,
            },
            style,
          ]}
        >
          {title && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ ...typography.subtitle, color: colors.textPrimary }}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          {children}
        </View>
      </View>
    </RNModal>
  );
}
