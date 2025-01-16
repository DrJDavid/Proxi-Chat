'use client'

import { useEffect, useRef } from 'react'
import { Button } from './button'

const commonEmojis = [
  '👍', '❤️', '😊', '😂', '🎉',
  '👏', '🔥', '💯', '✨', '🙌',
  '😍', '🤔', '👀', '💪', '🚀',
  '💖', '💡', '🌟', '🎨', '🎯'
]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClickOutside: () => void
}

export function EmojiPicker({ onEmojiSelect, onClickOutside }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClickOutside])

  return (
    <div 
      ref={ref}
      className="p-2 bg-background border rounded-md shadow-lg grid grid-cols-5 gap-1 w-[200px]"
    >
      {commonEmojis.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEmojiSelect(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  )
} 