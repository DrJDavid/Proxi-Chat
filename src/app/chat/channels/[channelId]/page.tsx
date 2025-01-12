"use client"

import { useParams } from "next/navigation"
import { Hash, Paperclip, Send, SmilePlus } from "lucide-react"
import { useCallback, useState, KeyboardEvent, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePolling } from "@/hooks/usePolling"
import { useMessagesStore } from "@/store/messages"
import { useUserStore } from "@/store/user"
import { messageApi } from "@/lib/api/messages"
import { type Message } from "@/types"
import { toast } from "sonner"

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ChannelPage() {
  const { channelId } = useParams() as { channelId: string }
  const [message, setMessage] = useState("")
  const { messages, setMessages, addMessage } = useMessagesStore()
  const { user, fetchUser } = useUserStore()
  const [channelUuid, setChannelUuid] = useState<string | null>(null)

  // Fetch user data on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Fetch channel UUID on mount
  useEffect(() => {
    async function getChannelUuid() {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from('channels')
          .select('id')
          .eq('name', channelId)
          .single()

        if (error) {
          console.error('Error fetching channel:', error)
          toast.error('Channel not found')
          return
        }

        setChannelUuid(data.id)
      } catch (error) {
        console.error('Error fetching channel:', error)
        toast.error('Failed to load channel')
      }
    }

    getChannelUuid()
  }, [channelId])

  const fetchChannelMessages = useCallback(async () => {
    if (!channelUuid) return []

    try {
      const messages = await messageApi.fetchMessages(channelUuid)
      setMessages(channelId, messages)
      return messages
    } catch (error) {
      console.error('Error fetching messages:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to load messages')
      }
      throw error
    }
  }, [channelId, channelUuid, setMessages])

  const { error, isLoading } = usePolling(
    fetchChannelMessages,
    3000,
    Boolean(channelUuid)
  )

  const handleSubmit = async () => {
    if (!message.trim() || !user || !channelUuid) return

    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message.trim(),
        channel_id: channelUuid,
        sender_id: user.id,
        receiver_id: null,
        created_at: new Date().toISOString(),
        has_attachment: false,
        parent_message_id: null,
        user: {
          id: user.id,
          username: user.username || 'Anonymous',
          full_name: user.full_name || 'Anonymous',
          avatar_url: user.avatar_url,
          status: user.status,
          last_seen: user.last_seen
        }
      }

      // Add optimistic message to store
      addMessage(channelId, optimisticMessage)
      setMessage("")

      // Send actual message
      await messageApi.sendMessage({
        content: optimisticMessage.content,
        channelId: channelUuid,
        senderId: user.id
      })

      // Fetch latest messages to sync
      await fetchChannelMessages()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to send message")
      }
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const channelMessages = messages[channelId] || []

  if (!user || !channelUuid) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          <h1 className="text-lg font-semibold">{channelId}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load messages. Please try again later.
          </div>
        )}
        <div className="space-y-4">
          {channelMessages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
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
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${channelId}`}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <SmilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add emoji</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" variant="default" size="icon" className="h-8 w-8">
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message (Enter)</TooltipContent>
            </Tooltip>
          </div>
        </form>
      </div>
    </div>
  )
} 