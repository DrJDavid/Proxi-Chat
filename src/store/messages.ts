import { create } from "zustand"
import type { Message, User } from "@/types"

interface MessagesState {
  messages: Record<string, Message[]>
  isLoading: boolean
  error: Error | null
  user: User | null
  addMessage: (channelId: string, message: Message) => void
  setMessages: (channelId: string, messages: Message[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  setUser: (user: User | null) => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: {},
  isLoading: false,
  error: null,
  user: null,
  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), message],
      },
    })),
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: messages,
      },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user })
})) 