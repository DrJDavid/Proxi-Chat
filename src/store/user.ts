import { create } from 'zustand'
import type { User } from '../types'
import type { UserState } from './store.types'
import supabase from '@/lib/supabase/client'
import { toast } from 'sonner'

const isBrowser = true

export const useUserStore = create<UserState>((set, get) => {
  let pollingInterval: NodeJS.Timeout | null = null

  const fetchUser = async () => {
    if (!supabase) return // Guard against server-side

    if (!pollingInterval) {
      set({ isLoading: true })
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      if (!session?.user) {
        set({ user: null })
        return
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) throw userError
      
      if (user) {
        set({ user })
      } else {
        set({ user: null })
        toast.error('User not found')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      set({ user: null })
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to fetch user')
      }
    } finally {
      if (!pollingInterval) {
        set({ isLoading: false })
      }
    }
  }

  const startPolling = () => {
    if (!isBrowser) return // Guard against server-side

    stopPolling()
    fetchUser()
    pollingInterval = setInterval(fetchUser, 5000)

    // Set up visibility change handler
    document.addEventListener('visibilitychange', () => {
      const user = get().user
      if (!user) return

      if (document.visibilityState === 'visible') {
        fetchUser()
      }
    })

    // Set up beforeunload handler
    window.addEventListener('beforeunload', () => {
      const user = get().user
      if (!user || !supabase) return

      // Using fetch directly since beforeunload doesn't wait for async
      fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offline' }),
        keepalive: true
      })
    })
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  return {
    user: null,
    isLoading: false,
    fetchUser,
    setUser: (user: User | null) => set({ user }),
    startPolling,
    stopPolling,
  }
}) 