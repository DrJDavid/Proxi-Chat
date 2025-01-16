"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LogOut, Settings, Sun, Moon, Laptop, Home, Upload, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { useUserStore } from '@/lib/store/useUserStore'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import supabase from '@/lib/supabase/client'
import { userApi } from '@/lib/api/users'
import { SearchDialog } from '@/components/chat/search-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function TopNav() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { currentUser: user, setCurrentUser } = useUserStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user?.username || '')
  const [status, setStatus] = useState(user?.status_message || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      router.push('/login')
      router.refresh()
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

  const handleStatusUpdate = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const newStatus = e.currentTarget.value.trim()
    
    try {
      console.log('Updating status message:', { userId: user!.id, newStatus })
      const { data, error } = await supabase
        .from('users')
        .update({ status_message: newStatus })
        .eq('id', user!.id)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setStatus(newStatus)
      
      // Update global state with the full user data
      if (data) {
        console.log('Updated user data:', data)
        setCurrentUser(data)
      }
      
      toast.success('Status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update status')
      }
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG, PNG, or GIF)')
      }

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('Not authenticated')

      const fileExt = file.type.split('/')[1]
      const fileName = `${user!.id}.${fileExt}` // Simplified file name

      console.log('Starting avatar upload:', { fileName, fileType: file.type, fileSize: file.size })

      // Upload the file
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully:', uploadData)

      // Get the public URL with cache-busting query parameter
      const timestamp = Date.now()
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      const urlWithTimestamp = `${publicUrl}?t=${timestamp}`

      console.log('Generated public URL:', urlWithTimestamp)

      // Update user profile with new avatar URL
      const { data: userData, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', user!.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        // Clean up uploaded file if profile update fails
        await supabase.storage
          .from('avatars')
          .remove([fileName])
        throw updateError
      }

      console.log('User profile updated with new avatar:', userData)

      // Update global state
      if (userData) {
        setCurrentUser(userData)
        // Force a refresh of the users list
        await userApi.fetchUsers()
      }

      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error in avatar upload process:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to upload avatar')
      }
    } finally {
      setIsUploadingAvatar(false)
      // Clear the file input
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="h-8 w-8"
        >
          <Home className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">ProxiChat</h1>
      </div>
      
      <div className="flex-1 max-w-md mx-4">
        <Input
          placeholder="Set your status..."
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={handleStatusUpdate}
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <SearchDialog />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/rag-assistant')}
              >
                <MessageSquareText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Ask About Gauntlet AI
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Laptop className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>

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
              Change Display Name
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <label className="flex items-center cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </DropdownMenuItem>
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
            <DialogTitle>Change Display Name</DialogTitle>
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