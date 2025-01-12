import { create } from "zustand"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@/types"
import { toast } from "sonner"

interface UserState {
  user: User | null
  isLoading: boolean
  error: Error | null
  fetchUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
}

export const useUserStore = create<UserState>((set) => {
  const supabase = createClientComponentClient()

  return {
    user: null,
    isLoading: false,
    error: null,

    fetchUser: async () => {
      // Don't fetch if we're already loading
      const state = useUserStore.getState()
      if (state.isLoading) return

      set({ isLoading: true, error: null })
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session?.user) {
          set({ user: null, isLoading: false })
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'Anonymous',
                full_name: session.user.user_metadata?.full_name || 'Anonymous',
                avatar_url: session.user.user_metadata?.avatar_url,
                status: 'online',
                last_seen: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) throw createError
            set({ user: newProfile, isLoading: false })
            return
          }
          throw profileError
        }

        set({ user: profile, isLoading: false })
      } catch (error) {
        console.error('Error fetching user:', error)
        const message = error instanceof Error ? error.message : 'Failed to fetch user profile'
        toast.error(message)
        set({ error: error as Error, isLoading: false })
      }
    },

    updateUser: async (updates) => {
      set({ isLoading: true, error: null })
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.user) throw new Error('No user session')

        const { data, error: updateError } = await supabase
          .from('users')
          .update({ ...updates, last_seen: new Date().toISOString() })
          .eq('id', session.user.id)
          .select()
          .single()

        if (updateError) throw updateError

        set({ user: data, isLoading: false })
        toast.success('Profile updated successfully')
      } catch (error) {
        console.error('Error updating user:', error)
        const message = error instanceof Error ? error.message : 'Failed to update profile'
        toast.error(message)
        set({ error: error as Error, isLoading: false })
      }
    }
  }
}) 