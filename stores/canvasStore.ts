import { create } from 'zustand';
import { Id } from '@/convex/_generated/dataModel';

// Define the possible views
type CanvasView = 'note' | 'video' | 'code' | 'idle' |'mermaid'|'whiteboard';

interface CodeSnippetData {
  title: string;
  language: string;
  code: string;
  description?: string;
}
interface MermaidData {
  title:string;
  diagram:string;
  description?:string;
}
interface whiteboardData {
  id:string;
  title:string;
  snapshot?:any;
}
interface videoData {
  title:string;
  videoId:string;
}
interface CanvasStore {
  // UI State
  isCanvasOpen: boolean;
  activeView: CanvasView;

  // Data State
  activeNoteId: Id<'notes'> | null;
  activeVideoId: videoData | null; // YouTube Video ID
  activeCodeSnippet: CodeSnippetData | null; // For the code execution panel
  activeMermaid: MermaidData | null; // For the mermaid panel
  activeWhiteboard: whiteboardData | null; // For the whiteboard panel
  // Actions
  setCanvasOpen: (isOpen: boolean) => void;
  openNote: (noteId: Id<'notes'>) => void;
  openVideo: (videoId: videoData) => void;
  openCode: (code: CodeSnippetData) => void;
  openMermaid: (mermaid: MermaidData) => void;
  openWhiteboard: (whiteboard: whiteboardData) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  isCanvasOpen: false,
  activeView: 'idle',
  activeNoteId: null,
  activeVideoId: null,
  activeCodeSnippet: null,
  activeMermaid: null,
  activeWhiteboard: null,
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
  }),
  openMermaid: (mermaid) => set({
    isCanvasOpen: true,
    activeView: 'mermaid',
    activeMermaid: mermaid
  }),
  openWhiteboard: (whiteboard) => set({
    isCanvasOpen: true,
    activeView: 'whiteboard',
    activeWhiteboard: whiteboard
  })
}));