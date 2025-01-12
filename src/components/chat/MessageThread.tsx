'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { type Message } from '@/types'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'

interface MessageThreadProps {
  parentMessage: Message
  onClose: () => void
}

export function MessageThread({ parentMessage, onClose }: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState('')
  const [replies, setReplies] = useState<Message[]>([])
  const { user } = useUserStore()

  useEffect(() => {
    fetchReplies()
  }, [parentMessage.id])

  const fetchReplies = async () => {
    try {
      const threadMessages = await messageApi.getThreadMessages(parentMessage.id)
      setReplies(threadMessages)
    } catch (error) {
      console.error('Error fetching replies:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to load replies')
      }
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return

    try {
      const reply = await messageApi.sendMessage({
        content: replyContent.trim(),
        channelId: parentMessage.channel_id,
        senderId: user.id,
        parentMessageId: parentMessage.id
      })

      setReplies(prev => [...prev, reply])
      setReplyContent('')
    } catch (error) {
      console.error('Error sending reply:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send reply')
      }
    }
  }

  return (
    <div className="flex flex-col h-full border-l">
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
              {parentMessage.user?.avatar_url && (
                <AvatarImage
                  src={parentMessage.user.avatar_url}
                  alt={`${parentMessage.user.username}'s avatar`}
                />
              )}
              <AvatarFallback>
                {parentMessage.user?.username ? getInitials(parentMessage.user.username) : '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{parentMessage.user?.username}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(parentMessage.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm">{parentMessage.content}</p>
            </div>
          </div>

          {/* Replies */}
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3 pl-6">
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
                <p className="text-sm">{reply.content}</p>
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