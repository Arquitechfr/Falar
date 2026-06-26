import { Text, View } from 'react-native';
import type { MessageStatus } from '../chatStore';

export function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') {
    return <Text className="text-textSecondary text-xs">⏳</Text>;
  }
  if (status === 'sent') {
    return <Text className="text-textSecondary text-xs">✓</Text>;
  }
  if (status === 'delivered') {
    return <Text className="text-textSecondary text-xs">✓✓</Text>;
  }
  if (status === 'read') {
    return <Text className="text-statusRead text-xs">✓✓</Text>;
  }
  return <Text className="text-red-500 text-xs">✕</Text>;
}
