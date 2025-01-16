"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PersonaType = 'teacher' | 'student' | 'expert' | 'casual' | 'mentor' | 'austinite';

const PERSONA_INFO: Record<PersonaType, { label: string, signature: string }> = {
  teacher: { label: 'Teacher', signature: '📚 Professor Helper' },
  student: { label: 'Student', signature: '🎓 Fellow Learner' },
  expert: { label: 'Expert', signature: '🔬 Technical Expert' },
  casual: { label: 'Casual Guide', signature: '👋 Friendly Guide' },
  mentor: { label: 'Mentor', signature: '🌟 Experienced Mentor' },
  austinite: { label: 'Austin Local', signature: '🌵 Austin Local' }
};

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function RagAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('casual')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      console.log('Sending request to /api/rag...')
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage,
          persona: selectedPersona 
        }),
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${responseText}`)
      }
      
      const data = JSON.parse(responseText)
      if (!data.answer) {
        throw new Error('No answer in response')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}` 
      }])
    } finally {
      setIsLoading(false)
    }
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
            <SelectTrigger className="w-[180px]">
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
                {message.content}
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

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
} 