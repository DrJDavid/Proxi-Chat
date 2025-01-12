'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, X, SmilePlus } from 'lucide-react'
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

interface MessageThreadProps {
  message: Message
  onClose: () => void
  onReply?: () => Promise<void>
}

export function MessageThread({ message, onClose, onReply }: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState('')
  const [replies, setReplies] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const { user } = useUserStore()

  const fetchReplies = useCallback(async () => {
    try {
      const threadMessages = await messageApi.getThreadMessages(message.id)
      setReplies(threadMessages)
      return threadMessages
    } catch (error) {
      console.error('Error fetching replies:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to load replies')
      }
      throw error
    }
  }, [message.id])

  // Poll for new replies
  usePolling(fetchReplies, 3000, true)

  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return

    try {
      const reply = await messageApi.sendMessage({
        content: replyContent.trim(),
        channelId: message.channel_id,
        senderId: user.id,
        parentMessageId: message.id
      })

      setReplies(prev => [...prev, reply])
      setReplyContent('')
      if (onReply) await onReply()
    } catch (error) {
      console.error('Error sending reply:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send reply')
      }
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
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {message.content.startsWith('[File shared]') ? (
                  <a 
                    href={message.content.match(/\((.*?)\)/)?.[1]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View shared file
                  </a>
                ) : (
                  message.content
                )}
              </p>
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
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {reply.content.startsWith('[File shared]') ? (
                    <a 
                      href={reply.content.match(/\((.*?)\)/)?.[1]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View shared file
                    </a>
                  ) : (
                    reply.content
                  )}
                </p>
                
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
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Reply to thread..."
            className="flex-1 min-h-[80px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendReply()
              }
            }}
          />
          <Button onClick={handleSendReply}>Reply</Button>
        </div>
      </div>
    </div>
  )
} 