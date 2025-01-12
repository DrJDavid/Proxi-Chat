'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { messageApi } from '@/lib/api/messages'
import { useUserStore } from '@/store/user'
import { useDirectMessageStore } from '@/store/direct-messages'
import { type Message, type User } from '@/types'
import { usePolling } from '@/hooks/usePolling'
import { toast } from 'sonner'

interface DirectMessageDialogProps {
  recipient: User
}

export function DirectMessageDialog({ recipient }: DirectMessageDialogProps) {
  const [messageContent, setMessageContent] = useState('')
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
          console.log('Incrementing unread DM for user:', recipient.id)
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

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
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
            Send
          </Button>
        </form>
      </div>
    </div>
  )
} 