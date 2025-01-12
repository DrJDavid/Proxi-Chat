"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hash, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreateChannel } from '@/components/chat/create-channel'
import { useChannelStore } from '@/store/channel'
import { useUserStore } from '@/store/user'
import { toast } from 'sonner'

export default function ChatPage() {
  const router = useRouter()
  const { channels, fetchChannels } = useChannelStore()
  const { user, isLoading: isUserLoading } = useUserStore()
  const [isChannelsLoading, setIsChannelsLoading] = useState(true)

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Wait for user to be loaded
        if (isUserLoading) return
        
        // If no user after loading, redirect to login
        if (!user) {
          router.push('/login')
          return
        }

        // Load channels
        await fetchChannels()
      } catch (error) {
        console.error('Error initializing chat:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Failed to initialize chat')
        }
      } finally {
        setIsChannelsLoading(false)
      }
    }

    initializeChat()
  }, [user, isUserLoading, fetchChannels, router])

  // Show loading state while user or channels are loading
  if (isUserLoading || isChannelsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // If no user after loading, return null (redirect will happen in useEffect)
  if (!user) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to ProxiChat</h1>
          <p className="text-muted-foreground">
            Join a channel to start chatting or create a new one
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Available Channels</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <CreateChannel />
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="grid gap-2">
              {channels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No channels available. Create one to get started!
                </div>
              ) : (
                channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/chat/channels/${channel.name}`)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{channel.name}</div>
                      {channel.description && (
                        <div className="text-sm text-muted-foreground">
                          {channel.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 