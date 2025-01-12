'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Paperclip, Send, MoreHorizontal, Smile, SmilePlus } from 'lucide-react'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { useDirectMessageStore } from '@/store/direct-messages'
import { type Message, type User } from '@/types'
import { usePolling } from '@/hooks/usePolling'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { FileUpload } from '@/components/chat/file-upload'
import { EmojiPicker } from '@/components/chat/emoji-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface DirectMessageDialogProps {
  recipient: User
}

// Helper function to format message content
function formatMessageContent(content: string) {
  // Special handling for file messages
  const fileRegex = /\[File shared: ([^\]]+)\]\(([^)]+)\)/
  const fileMatch = content.match(fileRegex)
  if (fileMatch) {
    const [, fileName, url] = fileMatch
    return (
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Shared a file
        </a>
      </div>
    )
  }

  // Handle other markdown-style links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  
  if (!content.match(linkRegex)) {
    return <span>{content}</span>
  }

  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>)
    }

    // Add the link
    const [, text, url] = match
    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {text}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // Add any remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}

export function DirectMessageDialog({ recipient }: DirectMessageDialogProps) {
  const [messageContent, setMessageContent] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const { user } = useUserStore()
  const { 
    messages: allMessages, 
    setMessages, 
    addMessage, 
    clearUnread,
    incrementUnread,
    selectedUser 
  } = useDirectMessageStore()

  const messages = allMessages[recipient.id] || []

  const fetchMessages = useCallback(async () => {
    if (!user) return []

    try {
      const directMessages = await messageApi.fetchDirectMessages(user.id, recipient.id)
      const currentMessages = allMessages[recipient.id] || []

      // Check if we have new messages
      if (directMessages.length > currentMessages.length) {
        const newMessageCount = directMessages.length - currentMessages.length
        const hasNewMessages = directMessages.slice(-newMessageCount).some(
          msg => msg.sender_id === recipient.id
        )

        // Only increment unread if:
        // 1. We have new messages from the recipient
        // 2. The dialog is not currently open
        // 3. This user is not currently selected
        if (hasNewMessages && !selectedUser) {
          incrementUnread(recipient.id)
        }
      }

      setMessages(recipient.id, directMessages)
      // Clear unread count when messages are fetched and dialog is open
      if (selectedUser?.id === recipient.id) {
        clearUnread(recipient.id)
      }
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
  }, [user, recipient.id, setMessages, clearUnread, incrementUnread, selectedUser, allMessages])

  // Poll for new messages
  usePolling(fetchMessages, 3000, Boolean(user))

  // Clear unread count when opening the dialog
  useEffect(() => {
    if (selectedUser?.id === recipient.id) {
      clearUnread(recipient.id)
    }
  }, [selectedUser, recipient.id, clearUnread])

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user) return

    try {
      const message = await messageApi.sendMessage({
        content: messageContent.trim(),
        senderId: user.id,
        receiverId: recipient.id
      })

      addMessage(recipient.id, message)
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

  const handleFileUpload = async (filePath: string) => {
    if (!user) return

    try {
      const message = await messageApi.sendMessage({
        content: `[File shared: ${filePath.split('/').pop()}](${filePath})`,
        senderId: user.id,
        receiverId: recipient.id
      })

      addMessage(recipient.id, message)
      setShowFileUpload(false)
    } catch (error) {
      console.error('Error sending file:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to send file')
      }
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await messageApi.deleteMessage(messageId)
      await fetchMessages()
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to delete message')
      }
    }
  }

  return (
    <div className="flex flex-col h-[400px] relative">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender_id === user?.id ? 'items-end' : 'items-start'
              } w-full`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                {message.sender_id !== user?.id && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {message.user && (
                      <>
                        <AvatarImage src={message.user.avatar_url} alt={message.user.username} />
                        <AvatarFallback>{getInitials(message.user.username)}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  {message.sender_id !== user?.id && (
                    <div className="text-sm font-medium mb-1">
                      {message.user?.username}
                    </div>
                  )}
                  <div className="group flex items-start gap-2">
                    <div
                      className={`rounded-lg px-4 py-2 break-words ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {formatMessageContent(message.content)}
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowEmojiPicker(message.id)}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      {message.sender_id === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              Delete Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {message.reactions.map((reaction) => (
                    <Button
                      key={reaction.id}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleAddReaction(message.id, reaction.emoji)}
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              if (showEmojiPicker) {
                handleAddReaction(showEmojiPicker, emoji)
              }
              setShowEmojiPicker(null)
            }}
            onClose={() => setShowEmojiPicker(null)}
          />
        </div>
      )}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <FileUpload 
                onUploadComplete={handleFileUpload} 
                dmId={recipient.id}
              />
            </DialogContent>
          </Dialog>
          <div className="flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!messageContent.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 