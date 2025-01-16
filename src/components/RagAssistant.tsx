"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRagConversation } from '@/lib/hooks/useRagConversation'
import { type PersonaType } from '@/types/rag'

export const PERSONA_INFO: Record<PersonaType, { label: string, signature: string }> = {
  teacher: { label: 'Teacher', signature: '📚 Professor Helper' },
  student: { label: 'Student', signature: '🎓 Fellow Learner' },
  expert: { label: 'Expert', signature: '🔬 Technical Expert' },
  casual: { label: 'Casual Guide', signature: '👋 Friendly Guide' },
  mentor: { label: 'Mentor', signature: '🌟 Experienced Mentor' },
  austinite: { label: 'Matthew McConaughey', signature: '🌵 Alright, alright, alright' }
};

interface RagAssistantProps {
  initialPersona?: PersonaType
}

export function RagAssistant({ initialPersona = 'casual' }: RagAssistantProps) {
  const [input, setInput] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(initialPersona)
  const { messages, isLoading, sendMessage } = useRagConversation(selectedPersona)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Chat Assistant</h3>
          <Select
            value={selectedPersona}
            onValueChange={(value: PersonaType) => setSelectedPersona(value)}
          >
            <SelectTrigger className="w-[180px]" suppressHydrationWarning>
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERSONA_INFO).map(([key, { label, signature }]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{signature}</span>
                    <span>{label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Currently chatting with: {PERSONA_INFO[selectedPersona].signature}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Ask me anything! I can help with both general questions and specific document knowledge.
          </div>
        ) : (
          messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-muted mr-4'
                }`}
              >
                <div className="prose dark:prose-invert prose-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.timestamp && (
                  <div className="text-xs opacity-50 mt-1" suppressHydrationWarning>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 mr-4">
              Thinking...
            </div>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t" suppressHydrationWarning>
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            suppressHydrationWarning
          />
          <Button type="submit" size="icon" disabled={isLoading} suppressHydrationWarning>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
} 