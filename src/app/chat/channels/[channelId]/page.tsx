"use client"

import { useParams } from "next/navigation"
import { Hash, MessageCircle, Paperclip, Send, SmilePlus, MoreHorizontal } from "lucide-react"
import { useCallback, useState, KeyboardEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageThread } from "@/components/chat/MessageThread"
import { usePolling } from "@/hooks/usePolling"
import { useMessagesStore } from "@/store/messages"
import { useUserStore } from "@/store/user"
import { useChannelStore } from "@/store/channel"
import { messageApi } from "@/lib/api/messages"
import { type Message } from "@/types"
import { toast } from "sonner"
import { channelApi } from "@/lib/api/channels"
import { getInitials } from "@/lib/utils"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/chat/file-upload"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageContent } from "@/components/chat/MessageContent"
import { RichTextInput } from "@/components/chat/RichTextInput"

export default function ChannelPage() {
  const { channelId } = useParams() as { channelId: string }
  const [message, setMessage] = useState("")
  const { messages: allMessages, setMessages } = useMessagesStore()
  const { user, fetchUser } = useUserStore()
  const [channelUuid, setChannelUuid] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { fetchChannels, selectedChannel, setSelectedChannel, incrementUnread } = useChannelStore()
  const lastFetchRef = useRef<number>(0)

  // Fetch user data on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Fetch channel UUID and set as selected channel on mount
  useEffect(() => {
    async function getChannelUuid() {
      try {
        const channel = await channelApi.getChannelByName(channelId)
        if (!channel) {
          toast.error('Channel not found')
          router.push('/chat')
          return
        }
        setChannelUuid(channel.id)
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
      if (newMessages.length !== currentMessages.length) {
        if (newMessages.length > currentMessages.length && channelUuid !== selectedChannel?.id) {
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
  }, [channelId, channelUuid, setMessages, selectedChannel, incrementUnread, allMessages])

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
    if (!message.trim() || !user || !channelUuid) return

    try {
      await messageApi.sendMessage({
        content: message,
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

  const handleFileUpload = async (fileUrl: string) => {
    if (!user || !channelUuid) return

    try {
      await messageApi.sendMessage({
        content: `[File shared](${fileUrl})`,
        channelId: channelUuid,
        senderId: user.id
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

  const channelMessages = allMessages[channelId] || []

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
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            <h1 className="text-lg font-semibold">{channelId}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.id === selectedChannel?.created_by && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={async () => {
                    if (!channelUuid) return
                    if (!confirm('Are you sure you want to delete this channel? This will delete all messages and cannot be undone.')) return

                    try {
                      await channelApi.deleteChannel(channelUuid)
                      await fetchChannels()
                      toast.success('Channel deleted successfully')
                      router.push('/chat')
                    } catch (error) {
                      console.error('Error deleting channel:', error)
                      toast.error(error instanceof Error ? error.message : 'Failed to delete channel')
                    }
                  }}
                >
                  Delete Channel
                </DropdownMenuItem>
              )}
              {user.id !== selectedChannel?.created_by && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleLeaveChannel}
                >
                  Leave Channel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.user?.id === user.id && (
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
                  <MessageContent content={message.content} />
                  
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
            await fetchChannelMessages();
          }}
        />
      )}
    </div>
  )
} 