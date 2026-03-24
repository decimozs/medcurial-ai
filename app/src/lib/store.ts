import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  // Signature Sidebar State
  signatureSortOrder: "asc" | "desc"
  setSignatureSortOrder: (order: "asc" | "desc") => void
  signatureExpandedGroups: string[]
  setSignatureExpandedGroups: (groups: string[]) => void
  addSignatureExpandedGroup: (group: string) => void
  removeSignatureExpandedGroup: (group: string) => void

  // Document Sidebar State
  documentSortOrder: "asc" | "desc"
  setDocumentSortOrder: (order: "asc" | "desc") => void
  documentExpandedGroups: string[]
  setDocumentExpandedGroups: (groups: string[]) => void
  addDocumentExpandedGroup: (group: string) => void
  removeDocumentExpandedGroup: (group: string) => void

  // Command Menu State
  isCommandMenuOpen: boolean
  setIsCommandMenuOpen: (open: boolean) => void

  // Chat Sidebar State
  chatSortOrder: "asc" | "desc"
  setChatSortOrder: (order: "asc" | "desc") => void
  chatExpandedGroups: string[]
  setChatExpandedGroups: (groups: string[]) => void
  addChatExpandedGroup: (group: string) => void
  removeChatExpandedGroup: (group: string) => void

  // Model Selection State
  selectedModel: string
  setSelectedModel: (model: string) => void

  // Global Recording State
  isRecording: boolean
  setIsRecording: (recording: boolean) => void

  // Sidebar State
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const AVAILABLE_MODELS = {
  "minimax-2.5": "minimax-m2.5:cloud",
  "minimax-2.7": "minimax-m2.7:cloud",
  "minimax-m2.1": "minimax-m2.1:cloud",
  "cogito-2.1": "cogito-2.1:671b-cloud",
  "gemini-flash": "gemini-3-flash-preview:cloud",
  "kimi-k2.5": "kimi-k2:cloud",
} as const

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Signature Sidebar State
      signatureSortOrder: "asc",
      setSignatureSortOrder: (order) => set({ signatureSortOrder: order }),
      signatureExpandedGroups: [],
      setSignatureExpandedGroups: (groups) =>
        set({ signatureExpandedGroups: groups }),
      addSignatureExpandedGroup: (group) =>
        set((state) => ({
          signatureExpandedGroups: [
            ...new Set([...state.signatureExpandedGroups, group]),
          ],
        })),
      removeSignatureExpandedGroup: (group) =>
        set((state) => ({
          signatureExpandedGroups: state.signatureExpandedGroups.filter(
            (g) => g !== group
          ),
        })),

      // Document Sidebar State
      documentSortOrder: "asc",
      setDocumentSortOrder: (order) => set({ documentSortOrder: order }),
      documentExpandedGroups: [],
      setDocumentExpandedGroups: (groups) =>
        set({ documentExpandedGroups: groups }),
      addDocumentExpandedGroup: (group) =>
        set((state) => ({
          documentExpandedGroups: [
            ...new Set([...state.documentExpandedGroups, group]),
          ],
        })),
      removeDocumentExpandedGroup: (group) =>
        set((state) => ({
          documentExpandedGroups: state.documentExpandedGroups.filter(
            (g) => g !== group
          ),
        })),

      // Command Menu State
      isCommandMenuOpen: false,
      setIsCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),

      // Chat Sidebar State
      chatSortOrder: "desc",
      setChatSortOrder: (order) => set({ chatSortOrder: order }),
      chatExpandedGroups: [],
      setChatExpandedGroups: (groups) => set({ chatExpandedGroups: groups }),
      addChatExpandedGroup: (group) =>
        set((state) => ({
          chatExpandedGroups: [
            ...new Set([...state.chatExpandedGroups, group]),
          ],
        })),
      removeChatExpandedGroup: (group) =>
        set((state) => ({
          chatExpandedGroups: state.chatExpandedGroups.filter(
            (g) => g !== group
          ),
        })),

      // Model Selection State
      selectedModel: "minimax-2.5",
      setSelectedModel: (model) => set({ selectedModel: model }),

      // Global Recording State
      isRecording: false,
      setIsRecording: (recording) => set({ isRecording: recording }),

      // Sidebar State
      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    {
      name: "medcurial-storage", // Key for localStorage
    }
  )
)
