"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { channelApi } from '@/lib/api/channels'
import { useChannelStore } from '@/store/channel'
import { toast } from 'sonner'
import { type Channel } from '@/types'

interface EditChannelProps {
  channel: Channel
  onClose?: () => void
  onSuccess?: (channel: Channel) => void
}

export function EditChannel({ channel, onClose, onSuccess }: EditChannelProps) {
  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const { fetchChannels, setSelectedChannel } = useChannelStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const updates: { name?: string; description?: string } = {}
      
      // Only include fields that have changed
      if (name.trim() !== channel.name) {
        updates.name = name.trim()
      }
      if (description.trim() !== channel.description) {
        updates.description = description.trim() || undefined
      }

      // If nothing has changed, just close
      if (Object.keys(updates).length === 0) {
        onClose?.()
        return
      }

      console.log('Attempting to update channel:', {
        channelId: channel.id,
        updates,
        originalChannel: channel
      })

      const updatedChannel = await channelApi.editChannel(channel.id, updates)
      console.log('Channel updated successfully:', updatedChannel)
      
      toast.success('Channel updated successfully')
      
      if (onSuccess) {
        await onSuccess(updatedChannel)
      } else {
        // Fallback to old behavior
        await fetchChannels()
        setSelectedChannel(updatedChannel)
        onClose?.()
      }
    } catch (error) {
      console.error('Error updating channel:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        channelId: channel.id,
        attemptedUpdates: {
          name: name.trim(),
          description: description.trim()
        }
      })
      
      if (error instanceof Error) {
        toast.error(error.message)
      } else if (typeof error === 'object' && error !== null) {
        try {
          const errorStr = JSON.stringify(error)
          toast.error(errorStr)
        } catch {
          toast.error('Failed to update channel')
        }
      } else {
        toast.error('Failed to update channel')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="general"
          required
        />
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
          disabled={isLoading || (name === channel.name && description === channel.description)}
        >
          {isLoading ? 'Updating...' : 'Update Channel'}
        </Button>
      </div>
    </form>
  )
} 