"use client"

import { useParams } from "next/navigation"
import { Hash, MessageCircle, Paperclip, Send, SmilePlus } from "lucide-react"
import { useCallback, useState, KeyboardEvent, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageThread } from "@/components/chat/MessageThread"
import { usePolling } from "@/hooks/usePolling"
import { useMessagesStore } from "@/store/messages"
import { useUserStore } from "@/store/user"
import { messageApi } from "@/lib/api/messages"
import { type Message } from "@/types"
import { toast } from "sonner"
import { channelApi } from "@/lib/api/channels"
import { getInitials } from "@/lib/utils"
import { EmojiPicker } from "@/components/ui/emoji-picker"

export default function ChannelPage() {
  const { channelId } = useParams() as { channelId: string }
  const [message, setMessage] = useState("")
  const { messages, setMessages } = useMessagesStore()
  const { user, fetchUser } = useUserStore()
  const [channelUuid, setChannelUuid] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)

  // Fetch user data on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Fetch channel UUID on mount
  useEffect(() => {
    async function getChannelUuid() {
      try {
        const channel = await channelApi.getChannelByName(channelId)
        if (!channel) {
          toast.error('Channel not found')
          return
        }
        setChannelUuid(channel.id)
      } catch (error) {
        console.error('Error fetching channel:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Failed to load channel')
        }
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
      await messageApi.sendMessage({
        content: message.trim(),
        channelId: channelUuid,
        senderId: user.id
      })

      setMessage("")
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

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      await messageApi.addReaction({
        messageId,
        userId: user.id,
        emoji
      })
      await fetchChannelMessages()
    } catch (error) {
      console.error('Error adding reaction:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add reaction')
      }
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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
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
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Reactions */}
                  <div className="flex items-center gap-2 mt-2">
                    {message.reactions?.map((reaction, index) => (
                      <Button
                        key={`${reaction.emoji}-${index}`}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleReaction(message.id, reaction.emoji)}
                      >
                        <span className="mr-1">{reaction.emoji}</span>
                        <span className="text-xs">
                          {message.reactions?.filter(r => r.emoji === reaction.emoji).length}
                        </span>
                      </Button>
                    ))}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 opacity-0 group-hover:opacity-100"
                        onClick={() => setShowEmojiPicker(message.id)}
                      >
                        <SmilePlus className="h-4 w-4" />
                      </Button>
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full mb-2">
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              handleReaction(message.id, emoji)
                              setShowEmojiPicker(null)
                            }}
                            onClickOutside={() => setShowEmojiPicker(null)}
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {(message.reply_count ?? 0) > 0 && (
                        <span className="ml-1 text-xs">{message.reply_count}</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #${channelId}`}
              className="min-h-[80px]"
              onKeyDown={handleKeyPress}
            />
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button onClick={handleSubmit} size="icon" className="shrink-0">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedMessage && (
        <div className="w-[400px]">
          <MessageThread
            parentMessage={selectedMessage}
            onClose={() => setSelectedMessage(null)}
          />
        </div>
      )}
    </div>
  )
} 