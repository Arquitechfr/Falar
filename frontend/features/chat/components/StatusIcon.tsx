import { useTheme } from '@/hooks/useTheme';
import { Clock, Check, CheckDouble, X } from '@/components/ui/Icons';
import type { MessageStatus } from '../chatStore';

export function StatusIcon({ status }: { status: MessageStatus }) {
  const { colors } = useTheme();
  const size = 14;

  if (status === 'sending') {
    return <Clock size={size} color={colors.textSecondary} />;
  }
  if (status === 'sent') {
    return <Check size={size} color={colors.textSecondary} />;
  }
  if (status === 'delivered') {
    return <CheckDouble size={size} color={colors.textSecondary} />;
  }
  if (status === 'read') {
    return <CheckDouble size={size} color={colors.statusRead} />;
  }
  return <X size={size} color={colors.danger} />;
}
