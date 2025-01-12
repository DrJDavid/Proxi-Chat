import { create } from 'zustand'
import { type Channel } from '@/types'
import { channelApi } from '@/lib/api/channels'

interface UnreadState {
  [channelId: string]: number
}

interface ChannelState {
  channels: Channel[]
  selectedChannel: Channel | null
  unreadMessages: UnreadState
  setSelectedChannel: (channel: Channel | null) => void
  fetchChannels: () => Promise<void>
  clearChannels: () => void
  incrementUnread: (channelId: string) => void
  clearUnread: (channelId: string) => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  selectedChannel: null,
  unreadMessages: {},
  
  setSelectedChannel: (channel) => {
    set({ selectedChannel: channel })
    if (channel) {
      // Clear unread count when selecting a channel
      set((state) => ({
        unreadMessages: {
          ...state.unreadMessages,
          [channel.id]: 0
        }
      }))
    }
  },
  
  fetchChannels: async () => {
    try {
      const channels = await channelApi.getUserChannels()
      set({ channels })
    } catch (error) {
      console.error('Error fetching channels:', error)
      set({ channels: [], selectedChannel: null })
      throw error
    }
  },

  clearChannels: () => {
    set({ channels: [], selectedChannel: null, unreadMessages: {} })
  },

  incrementUnread: (channelId: string) => {
    console.log('Incrementing unread for channel:', channelId)
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [channelId]: (state.unreadMessages[channelId] || 0) + 1
      }
    }))
  },

  clearUnread: (channelId: string) => {
    console.log('Clearing unread for channel:', channelId)
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [channelId]: 0
      }
    }))
  }
})) 