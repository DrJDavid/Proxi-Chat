"use client"

import { TopNav } from "@/components/chat/top-nav"
import { Sidebar } from "@/components/chat/sidebar"
import { useUserStore } from '@/lib/store/useUserStore'
import { useEffect } from 'react'
import { userApi } from '@/lib/api/users'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const startPolling = useUserStore(state => state.startPolling)
  const stopPolling = useUserStore(state => state.stopPolling)
  const setCurrentUser = useUserStore(state => state.setCurrentUser)

  useEffect(() => {
    // Initialize current user and start polling
    async function init() {
      try {
        const currentUser = await userApi.getCurrentUser()
        if (currentUser) {
          setCurrentUser(currentUser)
          startPolling()
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }
    
    init()
    return () => stopPolling()
  }, [startPolling, stopPolling, setCurrentUser])

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        {children}
      </div>
    </div>
  )
} 