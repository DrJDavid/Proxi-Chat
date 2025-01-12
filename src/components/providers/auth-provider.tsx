'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser } = useUserStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return <>{children}</>
} 