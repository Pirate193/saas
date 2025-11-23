import { create } from 'zustand';
import { Id } from '@/convex/_generated/dataModel';

// Define the possible views
type CanvasView = 'note' | 'video' | 'code' | 'idle';

interface CodeSnippetData {
  title: string;
  language: string;
  code: string;
  description?: string;
}

interface CanvasStore {
  // UI State
  isCanvasOpen: boolean;
  activeView: CanvasView;

  // Data State
  activeNoteId: Id<'notes'> | null;
  activeVideoId: string | null; // YouTube Video ID
  activeCodeSnippet: CodeSnippetData | null; // For the code execution panel

  // Actions
  setCanvasOpen: (isOpen: boolean) => void;
  openNote: (noteId: Id<'notes'>) => void;
  openVideo: (videoId: string) => void;
  openCode: (code: CodeSnippetData) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  isCanvasOpen: false,
  activeView: 'idle',
  activeNoteId: null,
  activeVideoId: null,
  activeCodeSnippet: null,

  setCanvasOpen: (isOpen) => set({ isCanvasOpen: isOpen }),

  openNote: (noteId) => set({ 
    isCanvasOpen: true, 
    activeView: 'note', 
    activeNoteId: noteId 
  }),

  openVideo: (videoId) => set({ 
    isCanvasOpen: true, 
    activeView: 'video', 
    activeVideoId: videoId 
  }),

  openCode: (code) => set({
    isCanvasOpen: true,
    activeView: 'code',
    activeCodeSnippet: code
  })
}));