import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Info, Trash2 } from 'lucide-react'
import { Channel } from '@/types'
import { channelApi } from '@/lib/api/channels'
import { toast } from 'sonner'
import { useUserStore } from '@/store/user'

interface ChannelInfoProps {
  channel: Channel
  onDelete?: () => Promise<void>
  showButtons?: boolean
  className?: string
}

export function ChannelInfo({ channel, onDelete, showButtons = true, className = '' }: ChannelInfoProps) {
  const [showInfo, setShowInfo] = useState(false)
  const { user } = useUserStore()

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInfo(true)
  }

  const handleDeleteChannel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this channel?')) return

    try {
      await channelApi.deleteChannel(channel.id)
      if (onDelete) {
        await onDelete()
      }
      toast.success('Channel deleted successfully')
      setShowInfo(false)
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast.error('Failed to delete channel')
    }
  }

  return (
    <>
      {showButtons && (
        <div className={`flex items-center gap-1 ${className}`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleInfoClick}
          >
            <Info className="h-4 w-4" />
          </Button>
          {user?.id === channel.created_by && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDeleteChannel}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Channel Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Name</h4>
              <div className="text-sm text-muted-foreground">#{channel.name}</div>
            </div>
            {channel.description && (
              <div>
                <h4 className="font-semibold">Description</h4>
                <div className="text-sm text-muted-foreground">{channel.description}</div>
              </div>
            )}
            <div>
              <h4 className="font-semibold">Created by</h4>
              <div className="text-sm text-muted-foreground">{channel.creator?.username}</div>
            </div>
            <div>
              <h4 className="font-semibold">Members</h4>
              <div className="text-sm text-muted-foreground">{channel.member_count} members</div>
            </div>
            <div>
              <h4 className="font-semibold">Created at</h4>
              <div className="text-sm text-muted-foreground">
                {new Date(channel.created_at).toLocaleDateString()}
              </div>
            </div>
            {user?.id === channel.created_by && (
              <div className="pt-4 flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleDeleteChannel}
                >
                  Delete Channel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 