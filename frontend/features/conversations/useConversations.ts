import { useQuery } from '@tanstack/react-query';
import { getConversations, type ConversationSummary } from './conversationsApi';
import { decryptMessage } from '@/features/crypto/encryption';
import { useCryptoStore } from '@/features/crypto/cryptoStore';
import { useAuthStore } from '@/features/auth/authStore';

export interface DecryptedConversation extends ConversationSummary {
  lastMessagePreview: string;
}

// Cache module-scope : survit aux re-renders, effacé à la déconnexion
const _previewCache = new Map<string, { nonce: string; preview: string }>();

export function clearConversationPreviewCache(): void {
  _previewCache.clear();
}

function decryptPreview(
  conversationId: string,
  encryptedPayload: string,
  nonce: string,
  privateKey: Uint8Array,
  senderPubKey: string,
): string {
  const cached = _previewCache.get(conversationId);

  // Cache hit : même nonce = même message = même preview
  if (cached && cached.nonce === nonce) {
    return cached.preview;
  }

  // Cache miss : déchiffrer et stocker
  let preview = '[message illisible]';
  try {
    const decrypted = decryptMessage(encryptedPayload, nonce, privateKey, senderPubKey);
    if (decrypted) preview = decrypted;
  } catch {
    // keep default
  }

  _previewCache.set(conversationId, { nonce, preview });
  return preview;
}

export function useConversations() {
  const privateKey = useCryptoStore((s) => s.privateKey);
  const currentUser = useAuthStore((s) => s.user);

  return useQuery<DecryptedConversation[]>({
    queryKey: ['conversations', privateKey ? 'ready' : 'no-key'],
    queryFn: async () => {
      const conversations = await getConversations();

      if (!privateKey) {
        return conversations.map((c) => ({ ...c, lastMessagePreview: '[message illisible]' }));
      }

      return conversations.map((c) => ({
        ...c,
        lastMessagePreview: decryptPreview(
          c.conversationId,
          c.lastMessage.encryptedPayload,
          c.lastMessage.nonce,
          privateKey,
          c.participantPublicKey,
        ),
      }));
    },
    enabled: !!currentUser,
    staleTime: 60_000,
  });
}
