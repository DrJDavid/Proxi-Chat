"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { User, LogOut, Settings, Sun, Moon, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/store/user'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import supabase from '@/lib/supabase/client'

export function TopNav() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user } = useUserStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user?.username || '')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to sign out')
      }
    }
  }

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim() || displayName === user.username) return
    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({ username: displayName.trim() })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Display name updated successfully')
      setIsSettingsOpen(false)
    } catch (error) {
      console.error('Error updating display name:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update display name')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <h1 className="text-lg font-semibold">ProxiChat</h1>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {theme === 'light' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Laptop className="mr-2 h-4 w-4" />
                )}
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDisplayName}
                disabled={!displayName.trim() || displayName === user.username || isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 