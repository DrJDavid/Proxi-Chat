import { create } from 'zustand'
import { type Message } from '@/types'
import { messageApi } from '@/lib/api/messages'
import { toast } from 'sonner'

interface MessageState {
  messages: Message[]
  isLoading: boolean
  error: string | null
  selectedMessage: Message | null
  setSelectedMessage: (message: Message | null) => void
  fetchMessages: (channelId: string) => Promise<void>
  sendMessage: (params: {
    content: string
    channelId: string
    senderId: string
    parentMessageId?: string
    isAgent?: boolean
    agentPersona?: string
  }) => Promise<Message>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  clearMessages: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedMessage: null,

  setSelectedMessage: (message) => set({ selectedMessage: message }),

  fetchMessages: async (channelId) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await messageApi.fetchMessages(channelId)
      set({ messages, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages'
      set({ error: errorMessage, isLoading: false })
      toast.error(errorMessage)
      throw error
    }
  },

  sendMessage: async ({ content, channelId, senderId, parentMessageId, isAgent, agentPersona }) => {
    set({ error: null })
    try {
      const message = await messageApi.sendMessage({
        content,
        channelId,
        senderId,
        parentMessageId,
        isAgent,
        agentPersona
      })
      set((state) => ({ messages: [...state.messages, message] }))
      return message
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      set({ error: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  },

  editMessage: async (messageId, content) => {
    set({ error: null })
    try {
      const updatedMessage = await messageApi.editMessage(messageId, content)
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? updatedMessage : msg
        ),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit message'
      set({ error: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  },

  deleteMessage: async (messageId) => {
    set({ error: null })
    try {
      await messageApi.deleteMessage(messageId)
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message'
      set({ error: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
})) 