import { create } from 'zustand'
import { type Channel } from '@/types'
import { channelApi } from '@/lib/api/channels'

interface ChannelState {
  channels: Channel[]
  selectedChannel: Channel | null
  setSelectedChannel: (channel: Channel | null) => void
  fetchChannels: () => Promise<void>
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  selectedChannel: null,
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  fetchChannels: async () => {
    try {
      const channels = await channelApi.getChannels()
      set({ channels })
    } catch (error) {
      console.error('Error fetching channels:', error)
      throw error
    }
  }
})) 