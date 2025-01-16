"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChannelStore } from '@/store/channel'
import { useUserStore } from '@/store/user'
import { channelApi } from '@/lib/api/channels'
import { ChannelMessages } from '@/components/chat/channel-messages'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.channelId as string
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUserStore()
  const { setSelectedChannel } = useChannelStore()

  useEffect(() => {
    async function loadChannel() {
      if (!user) {
        console.log('No user found, waiting for user data...')
        return
      }

      if (!channelId) {
        console.error('No channelId provided')
        setError('Channel ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log('Loading channel:', channelId)

        let channel = null

        // If the channelId looks like a UUID, try by ID first
        if (UUID_REGEX.test(channelId)) {
          console.log('Trying to find channel by ID first...')
          channel = await channelApi.getChannelById(channelId)
        }
        
        // If not found by ID or not a UUID, try by name
        if (!channel) {
          console.log('Trying to find channel by name...')
          channel = await channelApi.getChannelByName(channelId)
        }

        if (!channel) {
          console.error('Channel not found:', channelId)
          setError('Channel not found')
          return
        }

        // Check if user is a member
        console.log('Checking channel membership...')
        const isMember = await channelApi.isChannelMember(channel.id)
        console.log('Membership check result:', isMember)

        if (!isMember) {
          console.error('User is not a member of channel:', channel.id)
          setError('You are not a member of this channel')
          return
        }

        console.log('Setting selected channel:', channel)
        setSelectedChannel(channel)
        
        // Update URL to use channel name if needed
        if (channelId !== channel.name) {
          console.log('Updating URL to use channel name')
          router.replace(`/chat/channels/${channel.name}`)
        }
      } catch (error) {
        console.error('Error loading channel:', {
          error,
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          channelId,
          userId: user.id
        })
        
        let errorMessage = 'Failed to load channel'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          try {
            errorMessage = JSON.stringify(error)
          } catch {
            errorMessage = 'An unknown error occurred'
          }
        }
        
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadChannel()
  }, [channelId, user, router, setSelectedChannel])

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-destructive/10 text-destructive p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChannelMessages />
    </div>
  )
} 