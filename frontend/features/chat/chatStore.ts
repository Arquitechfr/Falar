import { create } from 'zustand';
import type { Message } from './chatApi';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage extends Message {
  decryptedText: string;
  optimisticStatus?: MessageStatus;
  tempId?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setTyping: (typing: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (
        state.messages.some(
          (m) =>
            (m._id && message._id && m._id === message._id) ||
            (m.tempId && message.tempId && m.tempId === message.tempId) ||
            (m.tempId && message._id && m.tempId === message._id),
        )
      ) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  prependMessages: (messages) =>
    set((state) => ({ messages: [...messages, ...state.messages] })),
  updateMessage: (id, patch) =>
    set((state) => {
      const updated = state.messages.map((m) =>
        m._id === id || m.tempId === id ? { ...m, ...patch } : m,
      );
      const newId = patch._id;
      if (newId) {
        const seen = new Set<string>();
        return {
          messages: updated.filter((m) => {
            const key = m._id || m.tempId;
            if (!key) return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        };
      }
      return { messages: updated };
    }),
  removeMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m._id !== id && m.tempId !== id) })),
  setTyping: (typing) => set({ isTyping: typing }),
  clear: () => set({ messages: [], isTyping: false }),
}));
