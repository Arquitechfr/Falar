import { create } from 'zustand';
import type { ConversationSummary } from './conversationsApi';

interface ConversationsState {
  conversations: ConversationSummary[];
  setConversations: (conversations: ConversationSummary[]) => void;
  updateConversation: (conversationId: string, patch: Partial<ConversationSummary>) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  updateConversation: (conversationId, patch) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId ? { ...c, ...patch } : c,
      ),
    })),
}));
