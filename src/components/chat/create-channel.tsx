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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const newChannel = await channelApi.createChannel(name.trim(), description.trim() || undefined)
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Channel'}
        </Button>
      </div>
    </form>
  )
} 