"use client"

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { getInitials } from '@/lib/utils'
import { userApi } from '@/lib/api/users'

interface AvatarUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AvatarUploadDialog({ open, onOpenChange }: AvatarUploadDialogProps) {
  const { currentUser: user, setCurrentUser } = useUserStore()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be an image (JPEG, PNG, or GIF)')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setUploadProgress(0)

    // Cleanup old preview URL
    return () => URL.revokeObjectURL(objectUrl)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('Not authenticated')

      setUploadProgress(20)

      const fileExt = selectedFile.type.split('/')[1]
      const fileName = `${user.id}.${fileExt}`

      console.log('Starting avatar upload:', { fileName, fileType: selectedFile.type, fileSize: selectedFile.size })
      setUploadProgress(30)

      // Upload the file
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully:', uploadData)
      setUploadProgress(60)

      // Get the public URL with cache-busting
      const timestamp = Date.now()
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      const urlWithTimestamp = `${publicUrl}?t=${timestamp}`

      console.log('Generated public URL:', urlWithTimestamp)
      setUploadProgress(80)

      // Update user profile
      const { data: userData, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        await supabase.storage
          .from('avatars')
          .remove([fileName])
        throw updateError
      }

      setUploadProgress(100)
      console.log('User profile updated with new avatar:', userData)

      // Update global state
      if (userData) {
        setCurrentUser(userData)
        await userApi.fetchUsers()
      }

      toast.success('Avatar updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error in avatar upload process:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to upload avatar')
      }
    } finally {
      setIsUploading(false)
      clearSelection()
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-center gap-6">
            {/* Current Avatar */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current</p>
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
              </Avatar>
            </div>

            {/* Preview or New Avatar */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">New</p>
              <Avatar className="h-20 w-20">
                {previewUrl ? (
                  <>
                    <AvatarImage src={previewUrl} alt="Preview" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <AvatarFallback>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* File Input and Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
                id="avatar-upload"
                aria-label="Choose avatar image"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 