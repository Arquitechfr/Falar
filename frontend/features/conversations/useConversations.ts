import { useQuery } from '@tanstack/react-query';
import { getConversations, type ConversationSummary } from './conversationsApi';
import { decryptMessage } from '@/features/crypto/encryption';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';

export interface DecryptedConversation extends ConversationSummary {
  lastMessagePreview: string;
}

export function useConversations() {
  const privateKey = useCryptoStore((s) => s.privateKey);
  const currentUser = useAuthStore((s) => s.user);

  return useQuery<DecryptedConversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const conversations = await getConversations();
      if (!privateKey) return conversations.map((c) => ({ ...c, lastMessagePreview: '[message illisible]' }));

      return conversations.map((c) => {
        let preview = '[message illisible]';
        try {
          const decrypted = decryptMessage(
            c.lastMessage.encryptedPayload,
            c.lastMessage.nonce,
            privateKey,
            c.participantPublicKey,
          );
          if (decrypted) preview = decrypted;
        } catch {
          // keep default
        }
        return { ...c, lastMessagePreview: preview };
      });
    },
    enabled: !!currentUser,
  });
}
