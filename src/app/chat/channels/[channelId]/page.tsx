"use client"

import { useParams } from "next/navigation"
import { Hash, MessageCircle, Paperclip, Send, SmilePlus, MoreHorizontal, Pencil } from "lucide-react"
import { useCallback, useState, KeyboardEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageThread } from "@/components/chat/MessageThread"
import { usePolling } from "@/hooks/usePolling"
import { useMessagesStore } from "@/store/messages"
import { useUserStore } from "@/lib/store/useUserStore"
import { useChannelStore } from "@/store/channel"
import { messageApi } from "@/lib/api/messages"
import { type Message, type Channel, type User } from "@/types/index"
import { toast } from "sonner"
import { channelApi } from "@/lib/api/channels"
import { getInitials } from "@/lib/utils"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/chat/file-upload"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageContent } from "@/components/chat/MessageContent"
import { RichTextInput } from "@/components/chat/RichTextInput"
import { EditChannel } from "@/components/chat/edit-channel"

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

export default function ChannelPage() {
  const { channelId } = useParams() as { channelId: string }
  const [message, setMessage] = useState("")
  const { messages: allMessages, setMessages, updateMessage } = useMessagesStore()
  const { currentUser, startPolling } = useUserStore()
  const [channelUuid, setChannelUuid] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { fetchChannels, selectedChannel, setSelectedChannel, incrementUnread } = useChannelStore()
  const lastFetchRef = useRef<number>(0)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showEditChannel, setShowEditChannel] = useState(false)

  // Initialize user polling on mount
  useEffect(() => {
    startPolling()
  }, [startPolling])

  // Fetch channel UUID and set as selected channel on mount
  useEffect(() => {
    async function getChannelUuid() {
      try {
        console.log('Fetching channel by name:', channelId)
        const channel = await channelApi.getChannelByName(channelId)
        console.log('Channel data:', channel)
        if (!channel) {
          toast.error('Channel not found')
          router.push('/chat')
          return
        }
        console.log('Setting channel UUID:', channel.id)
        setChannelUuid(channel.id)
        console.log('Setting selected channel:', channel)
        setSelectedChannel(channel) // Set this channel as selected when we enter it
      } catch (error) {
        console.error('Error fetching channel:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Failed to load channel')
        }
        router.push('/chat')
      }
    }

    getChannelUuid()

    // Clear selected channel when leaving the page
    return () => {
      setSelectedChannel(null)
    }
  }, [channelId, router, setSelectedChannel])

  // Add debug effect for tracking selectedChannel and currentUser
  useEffect(() => {
    console.log('Current state:', {
      selectedChannel,
      currentUser,
      channelCreatorId: selectedChannel?.creator?.id,
      currentUserId: currentUser?.id,
      isCreator: selectedChannel?.creator?.id === currentUser?.id
    })
  }, [selectedChannel, currentUser])

  // Add effect to update URL when channel name changes
  useEffect(() => {
    if (selectedChannel && selectedChannel.name !== channelId) {
      console.log('Channel name changed, updating URL:', {
        from: channelId,
        to: selectedChannel.name
      })
      router.replace(`/chat/channels/${selectedChannel.name}`)
    }
  }, [selectedChannel, channelId, router])

  const fetchChannelMessages = useCallback(async () => {
    if (!channelUuid) return []
    
    // Prevent concurrent fetches
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) return [] // Debounce fetches
    lastFetchRef.current = now

    try {
      setIsLoading(true)
      setError(null)
      const newMessages = await messageApi.fetchMessages(channelUuid, { limit: 50 })
      const currentMessages = allMessages[channelId] || []

      // Only update if we have new messages
      if (newMessages.length > currentMessages.length) {
        // Only increment unread if this is not the currently viewed channel
        if (window.location.pathname !== `/chat/channels/${channelId}`) {
          console.log('Incrementing unread for channel:', channelId)
          incrementUnread(channelUuid)
        }
        setMessages(channelId, newMessages)
      }
      
      return newMessages
    } catch (error) {
      console.error('Error fetching messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [channelId, channelUuid, setMessages, incrementUnread, allMessages])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (channelUuid) {
      // Initial fetch
      fetchChannelMessages()

      // Set up polling with error handling
      intervalId = setInterval(async () => {
        try {
          await fetchChannelMessages()
        } catch (error) {
          console.error('Polling error:', error)
          // Don't show toast for polling errors to avoid spam
        }
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [channelUuid, fetchChannelMessages])

  const handleSubmit = async () => {
    if (!message.trim() || !currentUser || !channelUuid) return

    try {
      // Optimistically add the message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        channel_id: channelUuid,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        user: currentUser,
        reactions: [],
        reply_count: 0
      }

      setMessages(channelId, [...channelMessages, optimisticMessage])
      setMessage("")

      // Make the API call
      await messageApi.sendMessage({
        content: message,
        channelId: channelUuid,
        senderId: currentUser.id
      })

      // Fetch latest state
      await fetchChannelMessages()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to send message")
      }
      console.error('Error sending message:', error)
      // Revert optimistic update on error
      await fetchChannelMessages()
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return

    try {
      // Optimistically update the UI
      const message = channelMessages.find(m => m.id === messageId)
      if (message) {
        const existingReaction = message.reactions?.find(
          r => r.emoji === emoji && r.user?.id === currentUser.id
        )

        let updatedReactions = message.reactions || []
        if (existingReaction) {
          // Remove reaction
          updatedReactions = updatedReactions.filter(r => r.id !== existingReaction.id)
        } else {
          // Add reaction
          updatedReactions = [
            ...updatedReactions,
            {
              id: `temp-${Date.now()}`,
              emoji,
              created_at: new Date().toISOString(),
              user: {
                id: currentUser.id,
                username: currentUser.username,
                avatar_url: currentUser.avatar_url
              }
            }
          ]
        }

        const updatedMessage = {
          ...message,
          reactions: updatedReactions
        }

        updateMessage(channelId, messageId, updatedMessage)
      }

      // Make the API call
      await messageApi.addReaction({
        messageId,
        userId: currentUser.id,
        emoji
      })

      // Fetch latest state
      await fetchChannelMessages()
    } catch (error) {
      console.error('Error adding reaction:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add reaction')
      }
      // Revert optimistic update on error
      await fetchChannelMessages()
    }
  }

  const handleFileUpload = async (fileUrl: string) => {
    if (!currentUser || !channelUuid) return

    try {
      await messageApi.sendMessage({
        content: `[File shared](${fileUrl})`,
        channelId: channelUuid,
        senderId: currentUser.id
      })

      setShowFileUpload(false)
      await fetchChannelMessages()
      toast.success('File shared successfully')
    } catch (error) {
      console.error('Error sharing file:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to share file')
      }
    }
  }

  const handleLeaveChannel = async () => {
    if (!channelUuid) return

    try {
      await channelApi.leaveChannel(channelUuid)
      await fetchChannels()
      toast.success('Left channel successfully')
      router.push('/chat')
    } catch (error) {
      console.error('Error leaving channel:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to leave channel')
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return

    try {
      // Optimistically update the message
      const optimisticUpdate = {
        content: editContent.trim(),
        edited_at: new Date().toISOString()
      }
      updateMessage(channelId, editingMessage.id, optimisticUpdate)

      // Reset UI state immediately
      setEditingMessage(null)
      setEditContent("")
      
      // Make the API call
      await messageApi.editMessage(editingMessage.id, editContent.trim())
      
      // No need to await this since we've already updated optimistically
      fetchChannelMessages().catch(console.error)
      
      toast.success('Message updated')
    } catch (error) {
      console.error('Error editing message:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error)
      })
      
      // Revert the optimistic update on error by re-fetching
      await fetchChannelMessages()
      
      let errorMessage = 'Failed to edit message'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = String(error)
        }
      }
      
      toast.error(errorMessage)
    }
  }

  const handleEditChannel = () => {
    if (!selectedChannel || !currentUser || selectedChannel.creator?.id !== currentUser.id) return
    setShowEditChannel(true)
  }

  const handleEditSuccess = async (updatedChannel: Channel) => {
    console.log('Channel edit successful:', updatedChannel)
    setShowEditChannel(false)
    // Force refresh the channel data
    await fetchChannels()
    setSelectedChannel(updatedChannel)
    // If name changed, URL will update via the effect above
  }

  const handleMessageReply = async (parentMessage: Message) => {
    // Optimistically update the reply count
    const updatedMessage = {
      ...parentMessage,
      reply_count: (parentMessage.reply_count || 0) + 1
    }
    updateMessage(channelId, parentMessage.id, updatedMessage)
    
    // Fetch actual state
    await fetchChannelMessages()
  }

  const channelMessages = allMessages[channelId] || []

  if (!currentUser || !channelUuid) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            <h1 className="text-lg font-semibold">{channelId}</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {selectedChannel?.creator?.id === currentUser?.id && (
                  <DropdownMenuItem onClick={handleEditChannel}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Channel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLeaveChannel}>
                  Leave Channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {isLoading && channelMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading messages...</p>
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
                      {formatTimestamp(message.created_at)}
                      {message.edited_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </span>
                    {message.user?.id === currentUser.id && (
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
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Message
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm('Are you sure you want to delete this message?')) return

                              try {
                                await messageApi.deleteMessage(message.id)
                                await fetchChannelMessages()
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
                  
                  {/* Reactions */}
                  <div className="flex items-center gap-2 mt-2">
                    {message.reactions && message.reactions.length > 0 && message.reactions.reduce((acc, reaction) => {
                      const existingReaction = acc.find(r => r.emoji === reaction.emoji);
                      if (existingReaction) {
                        existingReaction.count++;
                      } else {
                        acc.push({ emoji: reaction.emoji, count: 1 });
                      }
                      return acc;
                    }, [] as { emoji: string; count: number }[]).map((reaction) => (
                      <Button
                        key={reaction.emoji}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleReaction(message.id, reaction.emoji)}
                      >
                        <span className="mr-1">{reaction.emoji}</span>
                        <span className="text-xs">{reaction.count}</span>
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
                        <div className="absolute bottom-full mb-2 z-50">
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              handleReaction(message.id, emoji)
                              setShowEmojiPicker(null)
                            }}
                            onClose={() => setShowEmojiPicker(null)}
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
                      {message.reply_count > 0 && (
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
                  channelId={channelUuid ?? undefined}
                  onUploadComplete={handleFileUpload}
                />
              </DialogContent>
            </Dialog>
            <div className="flex-1">
              <RichTextInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                placeholder={`Message #${channelId}`}
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              size="icon"
              className="shrink-0"
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {selectedMessage && (
        <MessageThread
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onReply={async () => {
            await handleMessageReply(selectedMessage)
          }}
        />
      )}

      <Dialog open={showEditChannel} onOpenChange={setShowEditChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          {selectedChannel && (
            <EditChannel
              channel={selectedChannel}
              onClose={() => setShowEditChannel(false)}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 