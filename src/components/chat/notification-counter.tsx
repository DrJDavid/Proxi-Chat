'use client'

import { useEffect, useState } from 'react'
import { useMessagesStore } from '@/store/messages'
import { useUserStore } from '@/store/user'
import { cn } from '@/lib/utils'

interface NotificationCounterProps {
  channelId?: string
  userId?: string
  className?: string
}

export function NotificationCounter({ channelId, userId, className }: NotificationCounterProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { messages } = useMessagesStore()
  const { user } = useUserStore()

  useEffect(() => {
    if (!user) return

    const targetId = channelId || userId
    if (!targetId) return

    const currentMessages = messages[targetId] || []
    const lastReadTime = localStorage.getItem(`lastRead:${targetId}`) || '0'
    
    // Count messages that are newer than last read time
    const count = currentMessages.filter(msg => {
      // Don't count our own messages
      if (msg.sender_id === user.id) return false
      return new Date(msg.created_at) > new Date(lastReadTime)
    }).length

    setUnreadCount(count)
  }, [messages, channelId, userId, user])

  // Update last read time when component unmounts or when switching channels/users
  useEffect(() => {
    const targetId = channelId || userId
    if (!targetId) return

    return () => {
      localStorage.setItem(`lastRead:${targetId}`, new Date().toISOString())
    }
  }, [channelId, userId])

  if (unreadCount === 0) return null

  return (
    <span 
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground",
        className
      )}
    >
      {unreadCount}
    </span>
  )
} 