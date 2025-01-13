'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { channelApi } from '@/lib/api/channels'
import { useChannelStore } from '@/store/channel'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Check } from 'lucide-react'

interface JoinChannelButtonProps {
  channelId: string
  onJoinStateChange?: () => void
}

export function JoinChannelButton({ channelId, onJoinStateChange }: JoinChannelButtonProps) {
  const [isJoined, setIsJoined] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { fetchChannels } = useChannelStore()
  const { toast } = useToast()

  const checkMembership = useCallback(async () => {
    try {
      const isMember = await channelApi.isChannelMember(channelId)
      setIsJoined(isMember)
    } catch (error) {
      console.error('Error checking channel membership:', error)
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    checkMembership()
  }, [channelId, checkMembership])

  const handleClick = async () => {
    if (isLoading || isJoined) return // Prevent action if already joined

    setIsLoading(true)
    try {
      await channelApi.joinChannel(channelId)
      setIsJoined(true)
      // Update the sidebar
      await fetchChannels()
      toast({
        title: 'Joined channel',
        description: 'You have successfully joined the channel.'
      })
      // Notify parent to refresh channel lists
      onJoinStateChange?.()
    } catch (error) {
      console.error('Error joining channel:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
      // Recheck membership on error
      await checkMembership()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isJoined ? 'secondary' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading || isJoined}
      className="min-w-[80px]"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isJoined ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Joined
        </>
      ) : (
        'Join'
      )}
    </Button>
  )
} 