"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Hash, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChannelStore } from '@/store/channel'
import { useUserStore } from '@/store/user'
import { userApi } from '@/lib/api/users'
import { messageApi } from '@/lib/api/messages'
import { type User, type Channel } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { DirectMessageDialog } from './direct-message-dialog'
import { toast } from 'sonner'
import { CreateChannel } from './create-channel'

export function Sidebar() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [recentDmUsers, setRecentDmUsers] = useState<User[]>([])
  const [displayCount, setDisplayCount] = useState(10)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { channels, selectedChannel, setSelectedChannel, fetchChannels, unreadMessages, clearUnread } = useChannelStore()
  const { user } = useUserStore()
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)

  // Function to fetch channels
  const refreshChannels = async () => {
    if (!user) return
    try {
      await fetchChannels()
    } catch (error) {
      console.error('Error fetching channels:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to load channels')
      }
    }
  }

  useEffect(() => {
    async function fetchUsersAndDms() {
      if (!user) return

      try {
        const allUsers = await userApi.fetchUsers()
        const filteredUsers = allUsers.filter(u => u.id !== user.id)

        // Get recent DM conversations
        const recentMessages = await messageApi.fetchRecentDirectMessageUsers(user.id)
        const recentUserIds = new Set(recentMessages.map((msg: { sender_id: string; receiver_id: string }) => 
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        ).slice(0, 3))

        // Split users into recent, online, and others
        const recent = filteredUsers.filter(u => recentUserIds.has(u.id))
        const onlineNotRecent = filteredUsers.filter(u => 
          u.status === 'online' && !recentUserIds.has(u.id)
        )
        const others = filteredUsers.filter(u => 
          u.status !== 'online' && !recentUserIds.has(u.id)
        )

        setRecentDmUsers(recent)
        setUsers([...onlineNotRecent, ...others])
      } catch (error) {
        console.error('Error fetching users:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Failed to load users')
        }
      }
    }

    fetchUsersAndDms()
  }, [user])

  // Initial channel fetch
  useEffect(() => {
    refreshChannels()
  }, [user])

  // Set up polling for channel updates
  useEffect(() => {
    if (!user) return

    const interval = setInterval(refreshChannels, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const displayedUsers = users.slice(0, displayCount)
  const hasMoreUsers = users.length > displayCount

  const handleChannelSelect = (channel: Channel) => {
    console.log('Selecting channel:', channel.name, 'Current unread:', unreadMessages[channel.id])
    setSelectedChannel(channel)
    router.push(`/chat/channels/${channel.name}`)
  }

  return (
    <div className="w-64 h-full border-r bg-muted/10">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Channels</h2>
              <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                  </DialogHeader>
                  <CreateChannel onClose={() => {
                    setIsCreateChannelOpen(false)
                    refreshChannels()
                  }} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {channels.map((channel: Channel) => {
                const unreadCount = unreadMessages[channel.id] || 0
                console.log(`Channel ${channel.name} unread:`, unreadCount)
                return (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start relative',
                      selectedChannel?.id === channel.id && 'bg-accent'
                    )}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    {channel.name}
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Direct Messages</h2>
            </div>

            {/* Recent DMs */}
            {recentDmUsers.length > 0 && (
              <div className="mb-2 space-y-1">
                {recentDmUsers.map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => setSelectedUser(user)}
                  />
                ))}
              </div>
            )}

            {/* Online Users */}
            <div className="space-y-1">
              {displayedUsers
                .filter(user => user.status === 'online')
                .map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => setSelectedUser(user)}
                  />
                ))}
            </div>

            {/* Offline Users */}
            <div className="space-y-1">
              {displayedUsers
                .filter(user => user.status !== 'online')
                .map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => setSelectedUser(user)}
                  />
                ))}
            </div>

            {/* Load More Button */}
            {hasMoreUsers && (
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setDisplayCount(prev => prev + 5)}
              >
                Load More
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* DM Dialog */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          {selectedUser && <DirectMessageDialog recipient={selectedUser} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserButton({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={onClick}
    >
      <div className="relative mr-2">
        <Avatar className="h-6 w-6">
          {user.avatar_url && (
            <AvatarImage
              src={user.avatar_url}
              alt={`${user.username}'s avatar`}
            />
          )}
          <AvatarFallback>
            {user.username ? getInitials(user.username) : '??'}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${
          user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
        }`} />
      </div>
      {user.username}
    </Button>
  )
} 