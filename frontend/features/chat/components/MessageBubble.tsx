import { View, Text, TouchableOpacity } from 'react-native';
import type { ChatMessage } from '../chatStore';
import { StatusIcon } from './StatusIcon';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onRetry?: () => void;
}

export function MessageBubble({ message, isMine, onRetry }: MessageBubbleProps) {
  const time = new Date(message.serverTimestamp || message.clientTimestamp).toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit' },
  );

  const isUnread = message.decryptedText === '[message illisible]';
  const status = message.optimisticStatus || message.status;

  return (
    <View className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} px-3 my-0.5`}>
      <View
        className={`max-w-[75%] rounded-lg px-3 py-2 ${
          isMine ? 'bg-bubbleMine' : 'bg-bubbleOther'
        }`}
      >
        {isUnread ? (
          <Text className="text-textSecondary italic text-sm">[message illisible]</Text>
        ) : (
          <Text className="text-textPrimary text-sm">{message.decryptedText}</Text>
        )}

        <View className="flex-row items-center gap-1 mt-1 self-end">
          <Text className="text-textSecondary text-[10px]">{time}</Text>
          {isMine && <StatusIcon status={status} />}
        </View>

        {message.optimisticStatus === 'failed' && onRetry && (
          <TouchableOpacity onPress={onRetry} className="mt-1">
            <Text className="text-red-400 text-xs">Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
