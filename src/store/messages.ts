import { create } from "zustand"
import type { Message, User } from "@/types"

interface MessagesState {
  messages: Record<string, Message[]>
  lastMessageTimestamps: Record<string, string>
  isLoading: boolean
  error: Error | null
  user: User | null
  addMessage: (channelId: string, message: Message) => void
  setMessages: (channelId: string, messages: Message[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  setUser: (user: User | null) => void
  getLastMessageTimestamp: (channelId: string) => string | null
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: {},
  lastMessageTimestamps: {},
  isLoading: false,
  error: null,
  user: null,

  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), message],
      },
      lastMessageTimestamps: {
        ...state.lastMessageTimestamps,
        [channelId]: message.created_at
      }
    })),

  setMessages: (channelId, messages) =>
    set((state) => {
      const lastMessage = messages[messages.length - 1]
      return {
        messages: {
          ...state.messages,
          [channelId]: messages,
        },
        lastMessageTimestamps: {
          ...state.lastMessageTimestamps,
          [channelId]: lastMessage?.created_at || state.lastMessageTimestamps[channelId]
        }
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  getLastMessageTimestamp: (channelId) => get().lastMessageTimestamps[channelId] || null
})) 