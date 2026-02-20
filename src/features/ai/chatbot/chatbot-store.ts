import { create } from "zustand";

type ChatbotView = "chat" | "threads";

type ChatbotState = {
  isOpen: boolean;
  view: ChatbotView;
  activeThreadId: string | null;
  hasUnread: boolean;
  showSuggestions: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setView: (view: ChatbotView) => void;
  setActiveThreadId: (id: string | null) => void;
  setHasUnread: (value: boolean) => void;
  setShowSuggestions: (value: boolean) => void;
};

export const useChatbotStore = create<ChatbotState>((set) => ({
  isOpen: false,
  view: "chat",
  activeThreadId: null,
  hasUnread: false,
  showSuggestions: false,
  open: () => set({ isOpen: true, hasUnread: false }),
  close: () => set({ isOpen: false, showSuggestions: false }),
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      hasUnread: state.isOpen ? state.hasUnread : false,
      showSuggestions: state.isOpen ? state.showSuggestions : false,
    })),
  setView: (view) => set({ view }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setHasUnread: (value) => set({ hasUnread: value }),
  setShowSuggestions: (value) => set({ showSuggestions: value }),
}));

export const openChatbot = () => {
  useChatbotStore.getState().open();
};

export const closeChatbot = () => {
  useChatbotStore.getState().close();
};

export const toggleChatbot = () => {
  useChatbotStore.getState().toggle();
};
