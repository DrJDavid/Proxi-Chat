"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { channelApi } from '@/lib/api/channels'
import { useChannelStore } from '@/store/channel'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'

// Channel name validation regex: lowercase letters, numbers, and dashes only
const CHANNEL_NAME_REGEX = /^[a-z0-9-]+$/
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 32

interface CreateChannelProps {
  onClose?: () => void
  selectAfterCreate?: boolean
}

export function CreateChannel({ onClose, selectAfterCreate = true }: CreateChannelProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { addChannel } = useChannelStore()

  const trimmedName = name.trim()
  const nameLength = trimmedName.length
  const isValidLength = nameLength >= MIN_NAME_LENGTH && nameLength <= MAX_NAME_LENGTH
  const isValidFormat = CHANNEL_NAME_REGEX.test(trimmedName)
  const isValidChannelName = isValidLength && isValidFormat

  const getValidationMessage = () => {
    if (!trimmedName) return null
    if (!isValidLength) {
      return `Channel name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`
    }
    if (!isValidFormat) {
      return 'Only lowercase letters, numbers, and dashes are allowed'
    }
    return 'Channel name is valid'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trimmedName) return
    
    if (!isValidChannelName) {
      toast.error(getValidationMessage())
      return
    }

    setIsLoading(true)
    try {
      const newChannel = await channelApi.createChannel(trimmedName, description.trim() || undefined)
      addChannel(newChannel, selectAfterCreate)
      
      if (selectAfterCreate) {
        router.push(`/chat/channels/${newChannel.name}`)
      }
      
      toast.success('Channel created successfully')
      onClose?.()
    } catch (error) {
      console.error('Error creating channel:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create channel')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="relative">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="general"
            required
            pattern="[a-z0-9-]+"
            maxLength={MAX_NAME_LENGTH}
            title="Only lowercase letters, numbers, and dashes are allowed"
            className="pr-8"
          />
          {trimmedName && (
            <div className="absolute right-2 top-2.5 text-sm">
              {isValidChannelName ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <p className={`${trimmedName && !isValidChannelName ? 'text-red-500' : 'text-muted-foreground'}`}>
            {trimmedName ? getValidationMessage() : 'Channel names can only contain lowercase letters, numbers, and dashes'}
          </p>
          <p className="text-muted-foreground">
            {nameLength}/{MAX_NAME_LENGTH}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Examples: general, support-team, channel-2
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel about?"
          className="resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !isValidChannelName}
        >
          {isLoading ? 'Creating...' : 'Create Channel'}
        </Button>
      </div>
    </form>
  )
} 