"use client"

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'
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

export function SearchDialog() {
  const router = useRouter()
  const params = useParams()
  const channelId = params?.channelId as string
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMessages([])
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchApi.search(searchQuery, channelId)
      setMessages(results.messages)
      setUsers(results.users)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }, [channelId])

  const debouncedSearch = useDebounce(handleSearch, 300)

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }

  const handleMessageClick = (message: Message) => {
    // TODO: Implement scrolling to message
    setOpen(false)
  }

  const handleUserClick = (user: User) => {
    // TODO: Implement opening DM with user
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
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleMessageClick(message)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={message.user.avatar_url}
                        alt={message.user.username}
                      />
                      <AvatarFallback>
                        {getInitials(message.user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {message.user.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
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