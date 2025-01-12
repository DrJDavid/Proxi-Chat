'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { type User } from '@/types'

interface UserListProps {
  users: User[]
  currentUserId: string
}

export function UserList({ users, currentUserId }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-4">Users</h2>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {users
            .filter(user => user.id !== currentUserId)
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
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
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.status === 'online' ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUser(user)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  {selectedUser && (
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Message {selectedUser.username}</DialogTitle>
                      </DialogHeader>
                      <DirectMessageDialog recipient={selectedUser} />
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  )
} 