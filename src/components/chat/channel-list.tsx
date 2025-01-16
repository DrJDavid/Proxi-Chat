'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { channelApi } from '@/lib/api/channels'
import { type Channel } from '@/types'
import { JoinChannelButton } from './join-channel-button'
import { useChannelStore } from '@/store/channel'
import { toast } from 'sonner'
import { ChannelInfo } from './channel-info'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'

function ChannelListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="cursor-default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-4 w-[100px] mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80px] mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChannelList() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { fetchChannels } = useChannelStore()

  const loadChannels = async () => {
    try {
      const allChannels = await channelApi.getChannels()
      setChannels(allChannels)
    } catch (error) {
      console.error('Error loading channels:', error)
      toast.error('Failed to load channels')
    }
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchChannels(), // Load sidebar channels
          loadChannels()  // Load all channels
        ])
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [fetchChannels])

  // Handle join/leave events
  const handleJoinStateChange = async () => {
    try {
      await loadChannels() // Just reload the main channel list
    } catch (error) {
      console.error('Error refreshing channels:', error)
    }
  }

  const handleCardClick = (channelId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((event.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/chat/channels/${channelId}`)
  }

  if (isLoading) {
    return <ChannelListSkeleton />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel) => (
        <Card 
          key={channel.id}
          onClick={(e) => handleCardClick(channel.id, e)}
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50",
            "relative" // For proper button click handling
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{channel.name}</span>
              <div className="flex items-center gap-2">
                <JoinChannelButton
                  key={`${channel.id}-${channel.member_count}`}
                  channelId={channel.id}
                  onJoinStateChange={handleJoinStateChange}
                />
                <ChannelInfo 
                  channel={channel} 
                  onDelete={handleJoinStateChange}
                  className="ml-2"
                />
              </div>
            </CardTitle>
            <CardDescription>
              Created by {channel.creator?.username || 'Unknown'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {channel.description || 'No description provided'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {channel.member_count} {channel.member_count === 1 ? 'member' : 'members'}
            </p>
          </CardContent>
        </Card>
      ))}
      {channels.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground">
          No channels available
        </div>
      )}
    </div>
  )
}

export default function ChannelListWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ChannelList />
    </ErrorBoundary>
  )
} 