'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { useChannelStore } from '@/store/channel'
import { type Message } from '@/types'
import { toast } from 'sonner'
import { MessageContent } from './MessageContent'
import { RichTextInput } from './RichTextInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function formatTimestamp(date: string) {
  const messageDate = new Date(date)
  const now = new Date()
  const isToday = messageDate.toDateString() === now.toDateString()
  const isThisYear = messageDate.getFullYear() === now.getFullYear()

  const time = messageDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (isToday) {
    return time
  }

  if (isThisYear) {
    return `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
  }

  return `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${time}`
}

export function ChannelMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const { user } = useUserStore()
  const { selectedChannel } = useChannelStore()
  const lastFetchRef = useRef<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!selectedChannel) return

    // Prevent concurrent fetches
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) return // Debounce fetches
    lastFetchRef.current = now

    try {
      setError(null)
      const channelMessages = await messageApi.fetchMessages(selectedChannel.id)
      
      // Only update state if messages have changed
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(channelMessages)) {
          return channelMessages
        }
        return prev
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [selectedChannel])

  // Initial fetch and polling
  useEffect(() => {
    if (!selectedChannel) return

    setIsLoading(true)
    fetchMessages()

    const intervalId = setInterval(fetchMessages, 3000)
    return () => clearInterval(intervalId)
  }, [selectedChannel, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !selectedChannel) return

    try {
      // Optimistic update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent.trim(),
        channel_id: selectedChannel.id,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        user,
        reactions: []
      }

      setMessages(prev => [...prev, optimisticMessage])
      setMessageContent('')

      // Send to server
      const message = await messageApi.sendMessage({
        content: messageContent.trim(),
        channelId: selectedChannel.id,
        senderId: user.id
      })

      // Update with actual message
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? message : m))
    } catch (error) {
      console.error('Error sending message:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send message')
      }
      // Revert optimistic update
      await fetchMessages()
    }
  }

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a channel to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b px-4 py-2">
        <h2 className="font-semibold">#{selectedChannel.name}</h2>
        <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
      </div>

      <div className="flex-1 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 group">
                  <Avatar className="h-8 w-8">
                    {message.user?.avatar_url && (
                      <AvatarImage
                        src={message.user.avatar_url}
                        alt={`${message.user.username}'s avatar`}
                      />
                    )}
                    <AvatarFallback>
                      {message.user?.username ? getInitials(message.user.username) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{message.user?.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.created_at)}
                      </span>
                      {message.user?.id === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this message?')) return

                                try {
                                  await messageApi.deleteMessage(message.id)
                                  await fetchMessages()
                                  toast.success('Message deleted')
                                } catch (error) {
                                  console.error('Error deleting message:', error)
                                  toast.error(error instanceof Error ? error.message : 'Failed to delete message')
                                }
                              }}
                            >
                              Delete Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <MessageContent content={message.content} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <RichTextInput 
            value={messageContent}
            onChange={setMessageContent}
            onSubmit={handleSendMessage}
            placeholder="Type a message..."
          />
        </div>
      </div>
    </div>
  )
} 