import { create } from 'zustand';
import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';

export type AiContext =
  | { type: 'folder'; id: string; name: string }
  | { type: 'file'; id: string; name: string }
  | { type: 'note'; id: string; name: string }
  | null;

interface AiStore {
  isOpen: boolean;
  activeChatId: string | null;
  context: AiContext;
  pendingMessage: PromptInputMessage | null;
  // Actions
  onOpen: (context?: AiContext) => void;
  onClose: () => void;
  toggle: () => void;
  setActiveChatId: (id: string | null) => void;
  setContext: (context: AiContext) => void;
  setPendingMessage: (message: PromptInputMessage | null) => void;
}

export const useAiStore = create<AiStore>((set) => ({
  isOpen: false,
  activeChatId: null,
  context: null,
  pendingMessage: null,
  onOpen: (context) => set({ isOpen: true, context: context || null }),
  onClose: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setContext: (context) => set({ context }),
  setPendingMessage: (message) => set({ pendingMessage: message }),
}));