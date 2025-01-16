'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { X, MoreHorizontal, SmilePlus } from 'lucide-react'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { Message } from '@/types'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { MessageContent } from "@/components/chat/MessageContent"
import { EmojiPickerDialog } from '@/components/chat/emoji-picker-dialog'
import { RichTextInput } from "./RichTextInput"

interface MessageThreadProps {
  message: Message
  onClose: () => void
  onReply?: () => Promise<void>
}

// Helper function to format timestamp
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

export function MessageThread({ message, onClose, onReply }: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState('')
  const [replies, setReplies] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUserStore()
  const lastFetchRef = useRef<number>(0)
  const hasInitialFetchRef = useRef(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchReplies = useCallback(async () => {
    // Prevent concurrent fetches
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) return [] // Debounce fetches
    lastFetchRef.current = now

    try {
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
      if (!hasInitialFetchRef.current) {
        setIsInitialLoading(false)
        hasInitialFetchRef.current = true
      }
    }
  }, [message.id])

  useEffect(() => {
    const intervalId: NodeJS.Timeout = setInterval(async () => {
      try {
        await fetchReplies()
      } catch (error) {
        console.error('Polling error:', error)
        // Don't show toast for polling errors to avoid spam
      }
    }, 3000)

    // Initial fetch
    fetchReplies()

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

  const handleReaction = async (emoji: string) => {
    if (!user) return

    try {
      await messageApi.addReaction({
        messageId: message.id,
        userId: user.id,
        emoji
      })

      // Update replies optimistically
      setReplies(prevReplies => prevReplies.map(reply => {
        if (reply.id === message.id) {
          const reactions = reply.reactions || []
          return {
            ...reply,
            reactions: [
              ...reactions,
              {
                id: `temp-${Date.now()}`,
                emoji,
                user_id: user.id,
                message_id: reply.id,
                created_at: new Date().toISOString(),
                user
              }
            ]
          }
        }
        return reply
      }))
    } catch (error) {
      console.error('Failed to add reaction:', error)
      toast.error('Failed to add reaction')
    }
  }

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-thread-scroll-area]')
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom on initial load and when new replies are added
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [scrollToBottom, replies])

  return (
    <div className="w-[400px] flex flex-col h-full border-l" ref={scrollAreaRef}>
      <div className="flex items-center justify-between p-4 border-b flex-none">
        <h3 className="font-semibold">Thread</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <ScrollArea 
          className="flex-1"
          data-thread-scroll-area
        >
          <div className="p-4">
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Original Message */}
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
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>
                  <MessageContent content={message.content} />
                </div>
              </div>

              {/* Replies Section */}
              <div className="space-y-4 pl-6">
                {isInitialLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading replies...</p>
                  </div>
                ) : replies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground">No replies yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Be the first to reply to this message</p>
                  </div>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3 group">
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
                            {formatTimestamp(reply.created_at)}
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
                          {reply.reactions && Object.entries(
                            reply.reactions.reduce<Record<string, { emoji: string, users: string[] }>>((acc, reaction) => {
                              if (!acc[reaction.emoji]) {
                                acc[reaction.emoji] = { emoji: reaction.emoji, users: [] }
                              }
                              acc[reaction.emoji].users.push(reaction.user_id)
                              return acc
                            }, {})
                          ).map(([emoji, data]) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleReaction(emoji)}
                            >
                              <span className="mr-1">{emoji}</span>
                              <span className="text-xs">{data.users.length}</span>
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
                              <EmojiPickerDialog
                                open={showEmojiPicker === reply.id}
                                onOpenChange={(open) => setShowEmojiPicker(open ? reply.id : null)}
                                onEmojiSelect={(emoji: string) => {
                                  handleReaction(emoji)
                                  setShowEmojiPicker(null)
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex-none bg-background">
          <div className="flex items-center gap-2">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSendReply()
              }}
              className="flex gap-2 w-full"
            >
              <RichTextInput
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleSendReply}
                placeholder="Reply to thread..."
                className="flex-1"
              />
              <Button type="submit" disabled={!replyContent.trim()}>
                Reply
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 