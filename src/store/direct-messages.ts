import { create } from 'zustand'
import type { Message, User } from '@/types'

interface UnreadDMState {
  [userId: string]: number
}

interface DirectMessageState {
  messages: Record<string, Message[]>
  unreadMessages: UnreadDMState
  selectedUser: User | null
  setSelectedUser: (user: User | null) => void
  addMessage: (userId: string, message: Message) => void
  setMessages: (userId: string, messages: Message[]) => void
  incrementUnread: (userId: string) => void
  clearUnread: (userId: string) => void
}

export const useDirectMessageStore = create<DirectMessageState>((set) => ({
  messages: {},
  unreadMessages: {},
  selectedUser: null,

  setSelectedUser: (user) => {
    set({ selectedUser: user })
    if (user) {
      // Clear unread count when selecting a user
      set((state) => ({
        unreadMessages: {
          ...state.unreadMessages,
          [user.id]: 0
        }
      }))
    }
  },

  addMessage: (userId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: [...(state.messages[userId] || []), message],
      }
    })),

  setMessages: (userId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: messages,
      }
    })),

  incrementUnread: (userId: string) => {
    console.log('Incrementing unread DM for user:', userId)
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: (state.unreadMessages[userId] || 0) + 1
      }
    }))
  },

  clearUnread: (userId: string) => {
    console.log('Clearing unread DM for user:', userId)
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0
      }
    }))
  }
})) 