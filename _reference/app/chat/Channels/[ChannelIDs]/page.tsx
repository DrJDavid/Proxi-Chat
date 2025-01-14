'use client'

import { useState, useEffect } from 'react'
import { Hash, MoreHorizontal, Smile, Paperclip, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Message {
  id: string
  user: {
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  reactions: {
    emoji: string
    count: number
    reacted: boolean
  }[]
}

const messages: Message[] = [
  {
    id: '1',
    user: {
      name: 'Alice Smith',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: 'Hey everyone! Just finished the new feature implementation 🎉',
    timestamp: '2:30 PM',
    reactions: [
      { emoji: '👍', count: 3, reacted: true },
      { emoji: '🎉', count: 2, reacted: false },
    ],
  },
  {
    id: '2',
    user: {
      name: 'Bob Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: 'Great work! The tests are passing and everything looks good.',
    timestamp: '2:32 PM',
    reactions: [
      { emoji: '👍', count: 2, reacted: false },
    ],
  },
]

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    console.log('ChannelPage mounted, channelId:', params.channelId)
  }, [params.channelId])

  if (!params.channelId) {
    return <div className="p-4">Error: No channel selected</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold">{params.channelId}</h1>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">
            3 members
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
              <span className="sr-only">Channel actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Channel Settings</DropdownMenuItem>
            <DropdownMenuItem>Invite People</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Leave Channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-4 group">
            <img
              src={message.user.avatar}
              alt=""
              className="rounded-full w-10 h-10 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{message.user.name}</span>
                <span className="text-sm text-muted-foreground">
                  {message.timestamp}
                </span>
              </div>
              <p className="mt-1">{message.content}</p>
              <div className="flex items-center gap-2 mt-2">
                {message.reactions.map((reaction, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 ${
                      reaction.reacted ? 'bg-muted' : ''
                    }`}
                  >
                    <span className="mr-1">{reaction.emoji}</span>
                    <span className="text-xs">{reaction.count}</span>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 opacity-0 group-hover:opacity-100"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Textarea
            placeholder={`Message #${params.channelId}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-5 w-5" />
                  <span className="sr-only">Add emoji</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add emoji</TooltipContent>
            </Tooltip>
            <Button size="icon" className="shrink-0">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

