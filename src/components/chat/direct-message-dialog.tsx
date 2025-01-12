'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { type Message, type User } from '@/types'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { usePolling } from '@/hooks/usePolling'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { Send, SmilePlus } from 'lucide-react'

interface DirectMessageDialogProps {
  recipient: User
}

export function DirectMessageDialog({ recipient }: DirectMessageDialogProps) {
  const [messageContent, setMessageContent] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const { user } = useUserStore()

  const fetchMessages = useCallback(async () => {
    if (!user) return []

    try {
      // We'll need to modify the messageApi to handle DMs
      const directMessages = await messageApi.fetchDirectMessages(user.id, recipient.id)
      setMessages(directMessages)
      return directMessages
    } catch (error) {
      console.error('Error fetching direct messages:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to load messages')
      }
      throw error
    }
  }, [user, recipient.id])

  // Poll for new messages
  usePolling(fetchMessages, 3000, Boolean(user))

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user) return

    try {
      const message = await messageApi.sendMessage({
        content: messageContent.trim(),
        senderId: user.id,
        receiverId: recipient.id
      })

      setMessages(prev => [...prev, message])
      setMessageContent('')
    } catch (error) {
      console.error('Error sending message:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send message')
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
      await fetchMessages()
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
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender_id === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
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
              <div className={`flex-1 ${message.sender_id === user?.id ? 'text-right' : ''}`}>
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
                <div className={`flex items-center gap-2 mt-2 ${
                  message.sender_id === user?.id ? 'justify-end' : ''
                }`}>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Message ${recipient.username}`}
            className="flex-1 min-h-[80px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setShowEmojiPicker('input')}
            >
              <SmilePlus className="h-5 w-5" />
            </Button>
            <Button onClick={handleSendMessage} size="icon" className="shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {showEmojiPicker === 'input' && (
            <div className="absolute bottom-20 right-4">
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setMessageContent(prev => prev + emoji)
                  setShowEmojiPicker(null)
                }}
                onClickOutside={() => setShowEmojiPicker(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 