import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from 'next-themes'

interface EmojiPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPickerDialog({ open, onOpenChange, onEmojiSelect }: EmojiPickerDialogProps) {
  const { theme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none max-w-[352px]">
        <DialogTitle className="sr-only">Select an emoji</DialogTitle>
        <Picker
          data={data}
          onEmojiSelect={(emoji: { native: string }) => {
            onEmojiSelect(emoji.native)
            onOpenChange(false)
          }}
          theme={theme === 'dark' ? 'dark' : 'light'}
          previewPosition="none"
          skinTonePosition="none"
        />
      </DialogContent>
    </Dialog>
  )
} 