"use client"

import { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from 'next-themes'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full right-0 mb-2 z-50"
      style={{ width: '352px' }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => onEmojiSelect(emoji.native)}
        theme={theme === 'dark' ? 'dark' : 'light'}
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  )
} 