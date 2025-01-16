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
import { MoreHorizontal, MessageSquare, SmilePlus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageThread } from './MessageThread'
import { EmojiPickerDialog } from './emoji-picker-dialog'
import { PERSONA_INFO } from '@/components/RagAssistant'
import { type PersonaType } from '@/types/rag'

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

const AGENT_MENTION_REGEX = /@(teacher|student|expert|casual|mentor|austinite)\b/g

export function ChannelMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState("")
  const { user } = useUserStore()
  const { selectedChannel } = useChannelStore()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastFetchRef = useRef<number>(0)
  const hasLoadedChannelRef = useRef<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!selectedChannel) return

    // Prevent concurrent fetches
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) return // Debounce fetches
    lastFetchRef.current = now

    try {
      setError(null)
      const channelMessages = await messageApi.fetchMessages(selectedChannel.id)
      
      // Update state while preserving optimistic updates
      setMessages(prev => {
        const optimisticMessageIds = prev
          .filter(msg => msg.id.startsWith('temp-') || msg.id === editingMessage?.id)
          .map(msg => msg.id)

        // Keep optimistic messages, use server data for everything else
        return channelMessages.map(serverMsg => {
          const optimisticMsg = prev.find(m => m.id === serverMsg.id)
          if (optimisticMessageIds.includes(serverMsg.id)) {
            return optimisticMsg!
          }
          return serverMsg
        })
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      setError(errorMessage)
    } finally {
      setIsInitialLoading(false)
    }
  }, [selectedChannel, editingMessage])

  // Initial fetch and polling
  useEffect(() => {
    if (!selectedChannel) return

    // Only show loading on first load of a channel
    if (hasLoadedChannelRef.current !== selectedChannel.id) {
      setIsInitialLoading(true)
      hasLoadedChannelRef.current = selectedChannel.id
    }
    
    fetchMessages()

    const intervalId = setInterval(fetchMessages, 3000)
    return () => clearInterval(intervalId)
  }, [selectedChannel, fetchMessages])

  // Scroll to bottom on new messages or channel change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollArea = scrollAreaRef.current
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }

    // Scroll on messages change
    scrollToBottom()

    // Also scroll after a short delay to handle dynamic content
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages, selectedChannel?.id])

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

      // Check for agent mentions
      const mentions = messageContent.match(AGENT_MENTION_REGEX)
      if (mentions) {
        const uniqueAgents = Array.from(new Set(mentions.map(m => m.slice(1) as PersonaType)))
        
        // Have each mentioned agent respond
        for (const persona of uniqueAgents) {
          try {
            console.log(`Requesting response from ${persona} agent...`)
            const response = await fetch('/api/rag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: messageContent,
                persona,
                channelId: selectedChannel.id
              })
            })

            const data = await response.json()
            
            if (!response.ok) {
              throw new Error(data.error || `Agent ${persona} failed to respond (${response.status})`)
            }

            if (!data.answer) {
              throw new Error(`Invalid response from ${persona} agent`)
            }
            
            console.log(`Got response from ${persona} agent:`, data)
            
            // Send agent's response as a new message
            const agentMessage = await messageApi.sendMessage({
              content: data.answer,
              channelId: selectedChannel.id,
              senderId: user.id,
              isAgent: true,
              agentPersona: persona
            })

            setMessages(prev => [...prev, agentMessage])
          } catch (error) {
            console.error(`Error getting response from ${persona}:`, error)
            const errorMessage = error instanceof Error ? error.message : `${PERSONA_INFO[persona].label} failed to respond`
            toast.error(errorMessage)
          }
        }
      }
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

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return

    try {
      // Optimistically update the message
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id ? {
          ...editingMessage,
          content: editContent.trim(),
          edited_at: new Date().toISOString()
        } : msg
      ))
      
      // Reset edit state
      setEditingMessage(null)
      setEditContent("")

      // Make the API call
      const updatedMessage = await messageApi.editMessage(editingMessage.id, editContent.trim())
      
      // Update with the server response
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id ? updatedMessage : msg
      ))
      
      toast.success('Message updated')
    } catch (error) {
      console.error('Error editing message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to edit message')
      // Revert to original message on error
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id ? editingMessage : msg
      ))
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
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b px-4 py-2 flex-none">
          <h2 className="font-semibold">#{selectedChannel?.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedChannel?.description}</p>
        </div>

        <div className="flex flex-col-reverse flex-1 overflow-hidden">
          <div className="border-t p-4 flex-none bg-background">
            <RichTextInput 
              value={messageContent}
              onChange={setMessageContent}
              onSubmit={handleSendMessage}
              placeholder="Type a message..."
            />
          </div>

          <ScrollArea 
            ref={scrollAreaRef} 
            className="flex-1"
          >
            <div className="p-4 flex flex-col-reverse">
              {error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              {isInitialLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start the conversation by sending a message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...messages].reverse().map((message) => (
                    <div 
                      key={message.id} 
                      id={`message-${message.id}`}
                      className="group flex gap-2 transition-colors duration-300"
                    >
                      <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                        <AvatarImage src={message.user?.avatar_url} alt={message.user?.username} />
                        <AvatarFallback>{message.user?.username ? getInitials(message.user.username) : '??'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{message.user?.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(message.created_at)}
                            {message.edited_at && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </span>
                          {message.sender_id === user?.id && (
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
                                  onClick={() => {
                                    setEditingMessage(message)
                                    setEditContent(message.content)
                                  }}
                                >
                                  Edit Message
                                </DropdownMenuItem>
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
                          <div className="flex-1" />
                        </div>
                        {editingMessage?.id === message.id ? (
                          <div className="mt-2">
                            <RichTextInput
                              value={editContent}
                              onChange={setEditContent}
                              onSubmit={handleEditMessage}
                              placeholder="Edit your message..."
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMessage(null)
                                  setEditContent("")
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleEditMessage}
                                disabled={!editContent.trim() || editContent === message.content}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <MessageContent content={message.content} />
                        )}
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {/* Reactions */}
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
                          
                          {/* Add Reaction Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 opacity-0 group-hover:opacity-100"
                            onClick={() => setShowEmojiPicker(message.id)}
                          >
                            <SmilePlus className="h-4 w-4" />
                          </Button>

                          {/* Thread Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 opacity-0 group-hover:opacity-100"
                            onClick={() => setThreadMessage(message)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {message.reply_count || ''}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {threadMessage && (
        <MessageThread
          message={threadMessage}
          onClose={() => setThreadMessage(null)}
          onReply={fetchMessages}
        />
      )}

      <EmojiPickerDialog
        open={showEmojiPicker !== null}
        onOpenChange={(open) => setShowEmojiPicker(open ? showEmojiPicker : null)}
        onEmojiSelect={(emoji: string) => {
          if (showEmojiPicker) {
            handleReaction(showEmojiPicker, emoji)
            setShowEmojiPicker(null)
          }
        }}
      />
    </div>
  )
} 