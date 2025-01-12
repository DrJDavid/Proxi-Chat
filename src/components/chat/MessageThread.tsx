'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageCircle, X, SmilePlus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { type Message } from '@/types'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { usePolling } from '@/hooks/usePolling'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageContent } from "@/components/chat/MessageContent"
import { RichTextInput } from "./RichTextInput"

interface MessageThreadProps {
  message: Message
  onClose: () => void
  onReply?: () => Promise<void>
}

export function MessageThread({ message, onClose, onReply }: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState('')
  const [replies, setReplies] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUserStore()
  const lastFetchRef = useRef<number>(0)

  const fetchReplies = useCallback(async () => {
    // Prevent concurrent fetches
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) return [] // Debounce fetches
    lastFetchRef.current = now

    try {
      setIsLoading(true)
      setError(null)
      const threadMessages = await messageApi.getThreadMessages(message.id)
      
      // Only update state if messages have changed
      setReplies(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(threadMessages)) {
          return threadMessages
        }
        return prev
      })
      
      return threadMessages
    } catch (error) {
      console.error('Error fetching replies:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load replies'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [message.id])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    // Initial fetch
    fetchReplies()

    // Set up polling with error handling
    intervalId = setInterval(async () => {
      try {
        await fetchReplies()
      } catch (error) {
        console.error('Polling error:', error)
        // Don't show toast for polling errors to avoid spam
      }
    }, 3000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [fetchReplies])

  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return

    try {
      // Optimistically update the UI
      const optimisticReply = {
        id: `temp-${Date.now()}`,
        content: replyContent.trim(),
        channel_id: message.channel_id,
        sender_id: user.id,
        parent_message_id: message.id,
        created_at: new Date().toISOString(),
        user,
        reactions: []
      }

      // Update local replies state
      setReplies(prev => [...prev, optimisticReply])
      setReplyContent('')

      // Update parent message reply count
      if (onReply) await onReply()

      // Make the API call
      const reply = await messageApi.sendMessage({
        content: replyContent.trim(),
        channelId: message.channel_id,
        senderId: user.id,
        parentMessageId: message.id
      })

      // Update with actual reply from server
      setReplies(prev => prev.map(r => r.id === optimisticReply.id ? reply : r))
    } catch (error) {
      console.error('Error sending reply:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send reply')
      }
      // Revert optimistic update
      await fetchReplies()
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
      await fetchReplies()
      if (onReply) await onReply()
    } catch (error) {
      console.error('Error adding reaction:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add reaction')
      }
    }
  }

  return (
    <div className="w-[400px] flex flex-col h-full border-l">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Thread</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {isLoading && replies.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading replies...</p>
          </div>
        )}
        <div className="space-y-4">
          {/* Parent Message */}
          <div className="flex items-start gap-3">
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
                            if (onReply) await onReply()
                            onClose()
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

          {/* Replies */}
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3 pl-6 group">
              <Avatar className="h-8 w-8">
                {reply.user?.avatar_url && (
                  <AvatarImage
                    src={reply.user.avatar_url}
                    alt={`${reply.user.username}'s avatar`}
                  />
                )}
                <AvatarFallback>
                  {reply.user?.username ? getInitials(reply.user.username) : '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{reply.user?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {reply.user?.id === user?.id && (
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
                            if (!confirm('Are you sure you want to delete this reply?')) return

                            try {
                              await messageApi.deleteMessage(reply.id)
                              await fetchReplies()
                              if (onReply) await onReply()
                              toast.success('Reply deleted')
                            } catch (error) {
                              console.error('Error deleting reply:', error)
                              toast.error(error instanceof Error ? error.message : 'Failed to delete reply')
                            }
                          }}
                        >
                          Delete Reply
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <MessageContent content={reply.content} />
                
                {/* Reactions */}
                <div className="flex items-center gap-2 mt-2">
                  {reply.reactions?.map((reaction, index) => (
                    <Button
                      key={`${reaction.emoji}-${index}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleReaction(reply.id, reaction.emoji)}
                    >
                      <span className="mr-1">{reaction.emoji}</span>
                      <span className="text-xs">
                        {reply.reactions?.filter(r => r.emoji === reaction.emoji).length}
                      </span>
                    </Button>
                  ))}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100"
                      onClick={() => setShowEmojiPicker(reply.id)}
                    >
                      <SmilePlus className="h-4 w-4" />
                    </Button>
                    {showEmojiPicker === reply.id && (
                      <div className="absolute bottom-full mb-2">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            handleReaction(reply.id, emoji)
                            setShowEmojiPicker(null)
                          }}
                          onClickOutside={() => setShowEmojiPicker(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <RichTextInput
            value={replyContent}
            onChange={setReplyContent}
            onSubmit={handleSendReply}
            placeholder="Reply to thread..."
          />
          <Button onClick={handleSendReply}>Reply</Button>
        </div>
      </div>
    </div>
  )
} 