import { create } from 'zustand'
import { type User } from '@/types'
import { userApi } from '@/lib/api/users'

interface UserStore {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: Error | null
  setCurrentUser: (user: User | null) => void
  startPolling: () => void
  stopPolling: () => void
  fetchUsers: () => Promise<void>
  updateCurrentUserStatus: (status: 'online' | 'offline' | 'away') => Promise<void>
}

let pollingInterval: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null
const POLLING_INTERVAL = 3000 // 3 seconds
const HEARTBEAT_INTERVAL = 5000 // 5 seconds

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  setCurrentUser: (user: User | null) => {
    set(state => ({
      currentUser: user,
      // Only update users array if user is not null
      users: user ? state.users.map(u => u.id === user.id ? user : u) : state.users
    }))
    // Start polling only when setting a user, stop when clearing
    if (user) {
      get().startPolling()
    } else {
      get().stopPolling()
    }
  },

  startPolling: () => {
    if (pollingInterval) return

    // Initial fetch and status update
    get().fetchUsers()
    const currentUser = get().currentUser
    if (currentUser) {
      get().updateCurrentUserStatus('online')
    }

    // Set up polling every 3 seconds
    pollingInterval = setInterval(() => {
      get().fetchUsers()
    }, POLLING_INTERVAL)

    // Update current user's status to online and set up heartbeat
    if (currentUser) {
      // Update last_seen every 5 seconds while online
      heartbeatInterval = setInterval(async () => {
        const user = get().currentUser
        if (user) {
          try {
            await userApi.updateLastSeen(user.id)
            await userApi.updateStatus(user.id, 'online')
          } catch (error) {
            console.error('Error updating last seen:', error)
          }
        }
      }, HEARTBEAT_INTERVAL)

      // Set up visibility change handler
      document.addEventListener('visibilitychange', async () => {
        const user = get().currentUser
        if (!user) return

        if (document.visibilityState === 'visible') {
          await get().updateCurrentUserStatus('online')
        } else {
          await get().updateCurrentUserStatus('away')
        }
      })

      // Set up beforeunload handler to mark user as offline
      window.addEventListener('beforeunload', () => {
        const user = get().currentUser
        if (user) {
          // Using fetch directly since beforeunload doesn't wait for async
          fetch('/api/users/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'offline' }),
            keepalive: true
          })
        }
      })
    }
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  },

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null })
      const users = await userApi.fetchUsers()
      
      // Keep the current user's data in sync
      const currentUser = get().currentUser
      if (currentUser) {
        const updatedCurrentUser = users.find(u => u.id === currentUser.id)
        if (updatedCurrentUser) {
          set({ currentUser: updatedCurrentUser })
        }
      }
      
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
