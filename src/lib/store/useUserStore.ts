import { create } from 'zustand'
import { type User } from '@/types'
import { userApi } from '@/lib/api/users'

interface UserStore {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: Error | null
  setCurrentUser: (user: User) => void
  startPolling: () => void
  stopPolling: () => void
  fetchUsers: () => Promise<void>
  updateCurrentUserStatus: (status: 'online' | 'offline' | 'away') => Promise<void>
}

let pollingInterval: NodeJS.Timeout | null = null
const POLLING_INTERVAL = 10000 // 10 seconds

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  setCurrentUser: (user: User) => {
    set({ currentUser: user })
  },

  startPolling: () => {
    if (pollingInterval) return

    // Initial fetch
    get().fetchUsers()

    // Set up polling every 10 seconds
    pollingInterval = setInterval(() => {
      get().fetchUsers()
    }, POLLING_INTERVAL)

    // Update current user's status to online and set up heartbeat
    const currentUser = get().currentUser
    if (currentUser) {
      get().updateCurrentUserStatus('online')
      
      // Update last_seen every 30 seconds while online
      const heartbeatInterval = setInterval(() => {
        const user = get().currentUser
        if (user && user.status === 'online') {
          get().updateCurrentUserStatus('online')
        }
      }, 30000)

      // Clean up heartbeat on window unload
      window.addEventListener('beforeunload', () => {
        clearInterval(heartbeatInterval)
      })
    }

    // Set up beforeunload handler to mark user as offline
    window.addEventListener('beforeunload', () => {
      const currentUser = get().currentUser
      if (currentUser) {
        // Using fetch directly since beforeunload doesn't wait for async
        fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offline' }),
          keepalive: true
        })
      }
    })
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  },

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null })
      const users = await userApi.fetchUsers()
      set({ users, isLoading: false })
    } catch (err) {
      set({ error: err as Error, isLoading: false })
    }
  },

  updateCurrentUserStatus: async (status: 'online' | 'offline' | 'away') => {
    try {
      const currentUser = get().currentUser
      if (!currentUser) return

      await userApi.updateStatus(currentUser.id, status)
      set(state => ({
        currentUser: { ...state.currentUser!, status },
        users: state.users.map(user => 
          user.id === currentUser.id 
            ? { ...user, status }
            : user
        )
      }))
    } catch (err) {
      set({ error: err as Error })
    }
  }
}))
