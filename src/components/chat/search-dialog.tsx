"use client"

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { channelApi } from '@/lib/api/channels'
import { toast } from 'sonner'
import { useChannelStore } from '@/store/channel'

export function SearchDialog() {
  const router = useRouter()
  const params = useParams()
  const channelId = params?.channelId as string
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [debouncedQuery] = useDebounce(query, 300)
  const { setSelectedUser } = useDirectMessageStore()
  const { channels } = useChannelStore()
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
      const results = await searchApi.search(searchQuery)
      console.log('Search results:', results)
      setMessages(results.messages)
      setUsers(results.users)
    } catch (error) {
      console.error('Search failed:', error)
      setMessages([])
      setUsers([])
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
      if (!message.channel_id) {
        toast.error('Channel information not found')
        return
      }

      const channel = channels.find(c => c.id === message.channel_id)
      if (!channel) {
        toast.error('Channel not found')
        return
      }

      setOpen(false)
      // Wait a bit for the dialog to close
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push(`/chat/channels/${channel.name}#message-${message.id}`)
    } finally {
      // Reset navigation lock after a delay
      setTimeout(() => setIsNavigating(false), 500)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search messages and users..."
            value={query}
            onChange={handleQueryChange}
            className="h-8"
          />
          <ScrollArea className="h-[300px]">
            {users.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium">Users</h4>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground">{user.full_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {messages.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Messages</h4>
                {messages.map((message) => {
                  const channel = channels.find(c => c.id === message.channel_id)
                  return (
                    <div
                      key={message.id}
                      className="flex items-start gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => handleMessageClick(message)}
                    >
                      <Avatar className="h-8 w-8">
                        {message.user && (
                          <>
                            <AvatarImage
                              src={message.user.avatar_url}
                              alt={message.user.username}
                            />
                            <AvatarFallback>
                              {getInitials(message.user.username)}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {message.user?.username}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {channel && (
                          <p className="text-xs text-muted-foreground">
                            in #{channel.name}
                          </p>
                        )}
                        <p className="text-sm truncate">{message.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {query && !isSearching && messages.length === 0 && users.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No results found
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 