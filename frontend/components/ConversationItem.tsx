import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from './Avatar';

interface ConversationItemProps {
  contact: string;
  lastMessagePreview: string;
  lastTimestamp: string;
  unreadCount: number;
  avatarUrl?: string;
  onPress: () => void;
}

export function ConversationItem({
  contact,
  lastMessagePreview,
  lastTimestamp,
  unreadCount,
  avatarUrl,
  onPress,
}: ConversationItemProps) {
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 bg-background active:bg-surface"
    >
      <Avatar name={contact} avatarUrl={avatarUrl} size={52} />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-textPrimary font-semibold text-base flex-1" numberOfLines={1}>
            {contact}
          </Text>
          <Text className="text-textSecondary text-xs ml-2">
            {formatTime(lastTimestamp)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-textSecondary text-sm flex-1" numberOfLines={1}>
            {lastMessagePreview}
          </Text>
          {unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-2">
              <Text className="text-background text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
