'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, startPolling, stopPolling } = useUserStore()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Initial auth check
    fetchUser()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await fetchUser()
        startPolling()
      } else if (event === 'SIGNED_OUT') {
        stopPolling()
      }
    })

    // Start polling if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        startPolling()
      }
    })

    // Cleanup subscription and polling on unmount
    return () => {
      subscription.unsubscribe()
      stopPolling()
    }
  }, [fetchUser, startPolling, stopPolling, supabase.auth])

  return <>{children}</>
} 