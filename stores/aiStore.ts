import { create } from 'zustand';
import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { Doc } from '@/convex/_generated/dataModel';

export type AiContext =
  | { type: 'folder'; id: string; name: string }
  | { type: 'file'; id: string; name: string }
  | { type: 'note'; id: string; name: string }
  | null;

interface Aibody{
  webSearch: boolean;
  studyMode: boolean;
  thinking: boolean;
  contextFolder: Doc<'folders'>[];
  contextNote: Doc<'notes'>[];
}
interface AiStore {
  isOpen: boolean;
  activeChatId: string | null;
  context: AiContext;
  pendingMessage: PromptInputMessage | null;
  body: Aibody;
  // Actions
  onOpen: (context?: AiContext) => void;
  onClose: () => void;
  toggle: () => void;
  setActiveChatId: (id: string | null) => void;
  setContext: (context: AiContext) => void;
  setPendingMessage: (message: PromptInputMessage | null) => void;
  setBody: (body: Aibody) => void;
}

export const useAiStore = create<AiStore>((set) => ({
  isOpen: false,
  activeChatId: null,
  context: null,
  pendingMessage: null,
  body: {
    webSearch: false,
    studyMode: false,
    thinking: false,
    contextFolder: [],
    contextNote: [],
  },
  onOpen: (context) => set({ isOpen: true, context: context || null }),
  onClose: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setContext: (context) => set({ context }),
  setPendingMessage: (message) => set({ pendingMessage: message }),
  setBody: (body) => set({ body }),
}));