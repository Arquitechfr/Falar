import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeScreen } from '@/components/SafeScreen';
import { ConversationItem } from '@/components/ConversationItem';
import { useConversations, type DecryptedConversation } from '@/features/conversations/useConversations';
import { searchUser } from '@/features/users/usersApi';
import { computeConversationId } from '@/utils/conversationId';
import { useAuthStore } from '@/features/auth/authStore';
import { theme } from '@/constants/theme';

export default function ConversationsScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const [showSearch, setShowSearch] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchPhone.trim()) return;
    setSearching(true);
    try {
      const user = await searchUser(searchPhone.trim());
      if (user) {
        setShowSearch(false);
        setSearchPhone('');
        const conversationId = computeConversationId(
          useAuthStore.getState().user?.id || '',
          user.id,
        );
        router.push({
          pathname: '/(main)/chat/[conversationId]',
          params: {
            conversationId,
            recipientId: user.id,
            recipientPubKey: user.publicKey,
            recipientName: user.displayName,
          },
        });
      }
    } finally {
      setSearching(false);
    }
  }, [searchPhone, router]);

  const handleConversationPress = (conv: DecryptedConversation) => {
    router.push({
      pathname: '/(main)/chat/[conversationId]',
      params: {
        conversationId: conv.conversationId,
        recipientId: conv.participantId,
        recipientPubKey: conv.participantPublicKey,
        recipientName: conv.participantDisplayName,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface">
        <Text className="text-textPrimary text-xl font-bold">Conversations</Text>
        <TouchableOpacity
          onPress={() => setShowSearch(true)}
          className="w-9 h-9 bg-primary rounded-full items-center justify-center"
        >
          <Text className="text-background text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => (
          <ConversationItem
            contact={item.participantDisplayName || item.participantId}
            lastMessagePreview={item.lastMessagePreview}
            lastTimestamp={item.lastTimestamp}
            unreadCount={item.unreadCount}
            avatarUrl={item.participantAvatarUrl}
            onPress={() => handleConversationPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View className="h-px bg-surface" />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-textSecondary text-base">Aucune conversation</Text>
          </View>
        }
      />

      <Modal visible={showSearch} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-surface rounded-2xl p-6 w-full">
            <Text className="text-textPrimary text-lg font-bold mb-4">
              Rechercher un utilisateur
            </Text>
            <TextInput
              className="bg-background rounded-xl px-4 py-3 text-textPrimary mb-4"
              placeholder="+33612345678"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              value={searchPhone}
              onChangeText={setSearchPhone}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowSearch(false);
                  setSearchPhone('');
                }}
                className="flex-1 bg-background rounded-xl py-3 items-center"
              >
                <Text className="text-textSecondary">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searching || !searchPhone.trim()}
                className="flex-1 bg-primary rounded-xl py-3 items-center"
              >
                {searching ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text className="text-background font-semibold">Rechercher</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}
