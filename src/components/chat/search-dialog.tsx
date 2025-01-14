"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { searchApi } from '@/lib/api/search'
import { type Message, type User } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { useDirectMessageStore } from '@/store/direct-messages'
import { toast } from 'sonner'
import { useChannelStore } from '@/store/channel'
import { useUserStore } from '@/store/user'

interface RawSearchResult {
  messages: Array<{
    id: string
    content: string
    created_at: string
    edited_at?: string
    channel_id?: string
    sender_id: string
    receiver_id?: string
    sender: Array<{
      id: string
      username: string
      avatar_url?: string
      created_at: string
    }> | null
    reactions?: Array<{
      id: string
      emoji: string
      user_id: string
      message_id: string
      created_at: string
      user: Array<{
        id: string
        username: string
        avatar_url?: string
        created_at: string
      }>
    }>
  }>
  users: User[]
}

interface SearchResult {
  messages: Array<{
    id: string
    content: string
    created_at: string
    edited_at?: string
    channel_id?: string
    sender_id: string
    receiver_id?: string
    sender: {
      id: string
      username: string
      avatar_url?: string
      created_at: string
    } | null
    reactions?: Array<{
      id: string
      emoji: string
      user_id: string
      message_id: string
      created_at: string
      user: {
        id: string
        username: string
        avatar_url?: string
        created_at: string
      }
    }>
  }>
  users: User[]
}

export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [debouncedQuery] = useDebounce(query, 300)
  const { setSelectedUser } = useDirectMessageStore()
  const { channels } = useChannelStore()
  const { user } = useUserStore()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setMessages([])
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      console.log('Searching for:', searchQuery)
      const rawResults = (await searchApi.search(searchQuery)) as RawSearchResult
      const results: SearchResult = {
        messages: rawResults.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          edited_at: msg.edited_at || undefined,
          channel_id: msg.channel_id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          sender: msg.sender?.[0] || null,
          reactions: msg.reactions?.map(r => ({
            id: r.id,
            emoji: r.emoji,
            user_id: r.user_id,
            message_id: r.message_id,
            created_at: r.created_at,
            user: r.user[0]
          }))
        })),
        users: rawResults.users
      }
      console.log('Search results:', results)
      
      // Transform messages to ensure they have the correct shape
      const transformedMessages = results.messages.map(msg => {
        const message: Message = {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          edited_at: msg.edited_at,
          channel_id: msg.channel_id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          user: msg.sender ? {
            id: msg.sender.id,
            username: msg.sender.username,
            avatar_url: msg.sender.avatar_url,
            created_at: msg.sender.created_at
          } : undefined,
          reactions: msg.reactions?.map(r => ({
            id: r.id,
            emoji: r.emoji,
            user_id: r.user_id,
            message_id: r.message_id,
            created_at: r.created_at,
            user: {
              id: r.user.id,
              username: r.user.username,
              avatar_url: r.user.avatar_url,
              created_at: r.user.created_at
            }
          })) || []
        }
        return message
      })

      setMessages(transformedMessages)
      setUsers(results.users)
    } catch (error) {
      console.error('Search failed:', error)
      setMessages([])
      setUsers([])
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleMessageClick = async (message: Message) => {
    if (isNavigating) return
    setIsNavigating(true)

    try {
      // Close dialog before navigating
      setOpen(false)

      // If it's a DM (no channel_id), open DM dialog
      if (!message.channel_id) {
        // Get the other user (not the current user)
        const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id
        
        // First try to find user in the message's user field
        let otherUser = message.user?.id === otherUserId ? message.user : undefined
        
        // If not found, try to find in users list
        if (!otherUser) {
          otherUser = users.find(u => u.id === otherUserId)
        }
        
        if (!otherUser) {
          toast.error("Could not find user information")
          return
        }

        // Open DM dialog with this user
        setSelectedUser(otherUser)
        return
      }

      // For channel messages, proceed with channel navigation
      const channel = channels.find(c => c.id === message.channel_id)
      if (!channel) {
        toast.error("Channel not found")
        return
      }

      router.push(`/chat/channels/${channel.name}#message-${message.id}`)
    } catch (error) {
      console.error('Error handling message click:', error)
      toast.error('Failed to navigate to message')
    } finally {
      setIsNavigating(false)
    }
  }

  const handleUserClick = (user: User) => {
    // Open DM dialog with the selected user
    setSelectedUser(user)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px] overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-[calc(80vh-120px)]">
          <div className="px-4 py-2">
            <Input
              placeholder="Search messages and users..."
              value={query}
              onChange={handleQueryChange}
            />
          </div>
          {isSearching ? (
            <div className="px-4 py-2 text-center">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pr-4">
                {messages.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Messages</h3>
                    <div className="space-y-2">
                      {messages.map((message) => {
                        const isDM = !message.channel_id
                        const otherUserId = isDM ? (message.sender_id === user?.id ? message.receiver_id : message.sender_id) : null
                        const otherUser = isDM ? (
                          message.user?.id === otherUserId ? message.user : users.find(u => u.id === otherUserId)
                        ) : null
                        const channel = !isDM ? channels.find(c => c.id === message.channel_id) : null
                        
                        return (
                          <Button
                            key={message.id}
                            variant="ghost"
                            className="w-full justify-start rounded-lg hover:bg-accent"
                            onClick={() => handleMessageClick(message)}
                          >
                            <div className="flex flex-col items-start gap-1 text-left w-full">
                              <div className="text-xs text-muted-foreground">
                                {isDM ? (
                                  <>DM with {otherUser?.username || 'Unknown User'}</>
                                ) : (
                                  <>#{channel?.name || 'unknown-channel'}</>
                                )}
                              </div>
                              <div className="text-sm truncate w-full">{message.content}</div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {users.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Users</h4>
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer"
                          onClick={() => handleUserClick(user)}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.avatar_url} alt={user.username} />
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user.username}</p>
                            {user.full_name && (
                              <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {query && !isSearching && messages.length === 0 && users.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No results found
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 