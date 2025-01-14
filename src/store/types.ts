import { type User } from '@/types'

export interface UserState {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  setUser: (user: User | null) => void
  startPolling: () => void
  stopPolling: () => void
} 