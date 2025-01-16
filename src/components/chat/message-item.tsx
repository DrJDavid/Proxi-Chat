"use client"

import { type Message } from '@/types'
import { PERSONA_INFO } from '@/components/RagAssistant'
import { type PersonaType } from '@/types/rag'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface MessageItemProps {
  message: Message
  showAvatar?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function formatTimestamp(date: string) {
  const messageDate = new Date(date)
  const time = messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${time}`
}

export function MessageItem({ message, showAvatar = true }: MessageItemProps) {
  return (
    <div className={cn("group relative flex items-start gap-3 py-3 hover:bg-muted/50", {
      'pl-12': !showAvatar,
      'pl-4': showAvatar
    })}>
      {showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user?.avatar_url || ''} />
          <AvatarFallback>{getInitials(message.user?.username || '')}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {message.is_agent && message.agent_persona ? (
              <span className="flex items-center gap-1">
                {PERSONA_INFO[message.agent_persona as PersonaType].label}
                <span className="text-xs text-muted-foreground">
                  {PERSONA_INFO[message.agent_persona as PersonaType].signature}
                </span>
              </span>
            ) : (
              message.user?.username || 'Unknown User'
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.created_at)}
          </span>
        </div>
        <div className="prose prose-sm break-words">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
} 