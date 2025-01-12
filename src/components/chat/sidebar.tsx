"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Hash, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChannelStore } from '@/store/channel'
import { useUserStore } from '@/lib/store/useUserStore'
import { useDirectMessageStore } from '@/store/direct-messages'
import { messageApi } from '@/lib/api/messages'
import { type User, type Channel } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { DirectMessageDialog } from './direct-message-dialog'
import { toast } from 'sonner'
import { CreateChannel } from './create-channel'
import { NotificationCounter } from './notification-counter'

interface UserButtonProps {
  user: User
  onClick: () => void
}

function UserButton({ user, onClick }: UserButtonProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start relative"
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-5 w-5 mr-2">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
        </Avatar>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
          user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
        )} />
      </div>
      <span className={cn(
        'truncate',
        user.status === 'online' ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {user.username}
      </span>
      <NotificationCounter userId={user.id} />
    </Button>
  )
}

export function Sidebar() {
  const router = useRouter()
  const [recentDmUsers, setRecentDmUsers] = useState<User[]>([])
  const [displayCount, setDisplayCount] = useState(10)
  const { channels, selectedChannel, setSelectedChannel, fetchChannels } = useChannelStore()
  const { currentUser, users } = useUserStore()
  const { selectedUser, setSelectedUser } = useDirectMessageStore()
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)

  // Function to fetch channels
  const refreshChannels = async () => {
    if (!currentUser) return
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
    async function fetchRecentDms() {
      if (!currentUser) return

      try {
        // Get recent DM conversations
        const recentMessages = await messageApi.fetchRecentDirectMessageUsers(currentUser.id)
        const recentUserIds = new Set(recentMessages.map((msg: { sender_id: string; receiver_id: string }) => 
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
        ).slice(0, 3))

        // Get recent users from the users list
        const recent = users.filter(u => recentUserIds.has(u.id))
        setRecentDmUsers(recent)
      } catch (error) {
        console.error('Error fetching recent DMs:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Failed to load recent messages')
        }
      }
    }

    fetchRecentDms()
  }, [currentUser, users])

  // Initial channel fetch
  useEffect(() => {
    refreshChannels()
  }, [currentUser])

  // Set up polling for channel updates
  useEffect(() => {
    if (!currentUser) return

    const interval = setInterval(refreshChannels, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [currentUser])

  if (!currentUser) return null

  const filteredUsers = users.filter(u => u.id !== currentUser.id)
  const displayedUsers = filteredUsers.slice(0, displayCount)
  const hasMoreUsers = filteredUsers.length > displayCount

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
    router.push(`/chat/channels/${channel.name}`)
  }

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser)
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
              {channels.map((channel: Channel) => (
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
                  <NotificationCounter channelId={channel.id} />
                </Button>
              ))}
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
                    onClick={() => handleUserSelect(user)}
                  />
                ))}
              </div>
            )}

            {/* Online Users */}
            <div className="space-y-1">
              {displayedUsers
                .filter(user => user.status === 'online' && !recentDmUsers.some(r => r.id === user.id))
                .map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => handleUserSelect(user)}
                  />
                ))}
            </div>

            {/* Offline Users */}
            <div className="space-y-1">
              {displayedUsers
                .filter(user => user.status !== 'online' && !recentDmUsers.some(r => r.id === user.id))
                .map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => handleUserSelect(user)}
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