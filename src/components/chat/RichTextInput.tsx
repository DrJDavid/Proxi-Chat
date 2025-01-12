import React, { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List
} from 'lucide-react'

interface RichTextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
}

export function RichTextInput({ value, onChange, onSubmit, placeholder }: RichTextInputProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (editorRef.current) {
      if (isInitialMount.current) {
        isInitialMount.current = false
        return
      }
      if (value === '') {
        editorRef.current.innerHTML = ''
      } else if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const isFormatActive = (format: string) => {
    if (!document.queryCommandState) return false
    switch (format) {
      case 'bold':
        return document.queryCommandState('bold')
      case 'italic':
        return document.queryCommandState('italic')
      case 'underline':
        return document.queryCommandState('underline')
      case 'strikethrough':
        return document.queryCommandState('strikeThrough')
      default:
        return false
    }
  }

  const toggleFormat = (format: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Handle list separately
    if (format === 'list') {
      const listItem = document.createElement('div')
      listItem.textContent = '• '
      const range = selection.getRangeAt(0)
      range.insertNode(listItem)
      range.collapse(false)
      handleChange()
      return
    }

    // Get the command based on format
    let command = ''
    switch (format) {
      case 'bold':
        command = 'bold'
        break
      case 'italic':
        command = 'italic'
        break
      case 'underline':
        command = 'underline'
        break
      case 'strikethrough':
        command = 'strikeThrough'
        break
      default:
        return
    }

    // Execute the command
    document.execCommand(command, false)
    handleChange()
  }

  const formatButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      label: 'Bold',
      format: 'bold',
      shortcut: 'Ctrl+B'
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: 'Italic',
      format: 'italic',
      shortcut: 'Ctrl+I'
    },
    {
      icon: <Underline className="h-4 w-4" />,
      label: 'Underline',
      format: 'underline',
      shortcut: 'Ctrl+U'
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      label: 'Strikethrough',
      format: 'strikethrough',
      shortcut: 'Ctrl+S'
    },
    {
      icon: <List className="h-4 w-4" />,
      label: 'Bullet List',
      format: 'list',
      shortcut: 'Ctrl+L'
    }
  ]

  const handleChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      if (content === '<br>') {
        onChange('')
      } else {
        onChange(content)
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 px-2 py-1 border rounded-md bg-background">
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            variant={isFormatActive(button.format) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat(button.format)}
            className="h-8 px-2"
            title={`${button.label} (${button.shortcut})`}
          >
            {button.icon}
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[80px] p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-ring whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        onKeyDown={handleKeyDown}
        onInput={handleChange}
        data-placeholder={placeholder}
        role="textbox"
        onSelect={() => {
          // Force a re-render to update button states
          editorRef.current?.focus()
        }}
      />
    </div>
  )
} 