"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Hash, Plus, Users, Bot } from 'lucide-react'
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
  isCurrentUser?: boolean
}

function UserButton({ user, onClick, isCurrentUser }: UserButtonProps) {
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
      <div className="flex flex-col items-start">
        <span className="truncate text-foreground">
          {user.username}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
          {isCurrentUser ? "note to self" : user.status_message}
        </span>
      </div>
      {!isCurrentUser && <NotificationCounter userId={user.id} />}
    </Button>
  )
}

function AllUsersDialog({ onClose }: { onClose: () => void }) {
  const { users, currentUser } = useUserStore()
  const { setSelectedUser } = useDirectMessageStore()

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    onClose()
  }

  return (
    <div className="space-y-2">
      {users
        .filter(user => user.id !== currentUser?.id)
        .map(user => (
          <UserButton
            key={user.id}
            user={user}
            onClick={() => handleUserSelect(user)}
          />
        ))}
    </div>
  )
}

type PersonaType = 'teacher' | 'student' | 'expert' | 'casual' | 'mentor' | 'austinite';

const PERSONA_INFO: Record<PersonaType, { label: string, signature: string }> = {
  teacher: { label: 'Teacher', signature: '📚 Professor Helper' },
  student: { label: 'Student', signature: '🎓 Fellow Learner' },
  expert: { label: 'Expert', signature: '🔬 Technical Expert' },
  casual: { label: 'Casual Guide', signature: '👋 Friendly Guide' },
  mentor: { label: 'Mentor', signature: '🌟 Experienced Mentor' },
  austinite: { label: 'Matthew McConaughey', signature: '🌵 Alright, alright, alright' }
};

export function Sidebar() {
  const router = useRouter()
  const [recentDmUsers, setRecentDmUsers] = useState<User[]>([])
  const { channels, selectedChannel, setSelectedChannel, fetchChannels } = useChannelStore()
  const { currentUser, users } = useUserStore()
  const { selectedUser, setSelectedUser } = useDirectMessageStore()
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [isAllUsersOpen, setIsAllUsersOpen] = useState(false)

  // Function to fetch channels
  const refreshChannels = useCallback(async () => {
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
  }, [currentUser, fetchChannels])

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
  }, [currentUser, refreshChannels])

  // Set up polling for channel updates
  useEffect(() => {
    if (!currentUser) return

    const interval = setInterval(refreshChannels, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [currentUser, refreshChannels])

  if (!currentUser) return null

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
          {/* Current User Profile */}
          {currentUser && (
            <div className="mb-4">
              <UserButton
                user={currentUser}
                onClick={() => handleUserSelect(currentUser)}
                isCurrentUser={true}
              />
            </div>
          )}

          {/* Channels Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold">Channels</h2>
              <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 -ml-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                  </DialogHeader>
                  <CreateChannel onClose={() => setIsCreateChannelOpen(false)} />
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

            {/* Recent DMs - Limited to 2 */}
            <div className="space-y-1">
              {recentDmUsers.slice(0, 2).map((user) => (
                <UserButton
                  key={user.id}
                  user={user}
                  onClick={() => handleUserSelect(user)}
                />
              ))}
            </div>

            {/* Online Users */}
            <div className="space-y-1">
              {users
                .filter(user => 
                  user.id !== currentUser.id && 
                  user.status === 'online' && 
                  !recentDmUsers.slice(0, 2).some(r => r.id === user.id)
                )
                .map((user) => (
                  <UserButton
                    key={user.id}
                    user={user}
                    onClick={() => handleUserSelect(user)}
                  />
                ))}
            </div>

            {/* See More Button */}
            <Dialog open={isAllUsersOpen} onOpenChange={setIsAllUsersOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full mt-2 justify-start"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  See More
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>All Users</DialogTitle>
                </DialogHeader>
                <AllUsersDialog onClose={() => setIsAllUsersOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* RAG Agents Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">RAG Agents</h2>
            </div>
            <div className="space-y-1">
              {Object.entries(PERSONA_INFO).map(([key, { label, signature }]) => (
                <Button
                  key={key}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(`/chat/rag/${key}`)}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground">{signature}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* DM Dialog */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          {selectedUser && <DirectMessageDialog 
            recipient={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />}
        </DialogContent>
      </Dialog>
    </div>
  )
} 