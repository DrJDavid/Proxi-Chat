import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'

type PersonaType = 'teacher' | 'student' | 'expert' | 'casual' | 'mentor' | 'austinite'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export function useRagConversation(persona: PersonaType) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Load existing conversation
  useEffect(() => {
    async function loadConversation() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: conversations, error } = await supabase
          .from('rag_conversations')
          .select('id, messages')
          .eq('user_id', user.id)
          .eq('persona', persona)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
          console.error('Error loading conversation:', error)
          toast({
            title: 'Error loading conversation',
            description: error.message,
            variant: 'destructive'
          })
          return
        }

        if (conversations) {
          setConversationId(conversations.id)
          setMessages(conversations.messages)
        }
      } catch (error) {
        console.error('Error in loadConversation:', error)
      }
    }

    loadConversation()
  }, [persona, supabase, toast])

  // Save messages when they change
  useEffect(() => {
    async function saveMessages() {
      if (messages.length === 0) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (conversationId) {
          // Update existing conversation
          const { error } = await supabase
            .from('rag_conversations')
            .update({
              messages,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)

          if (error) throw error
        } else {
          // Create new conversation
          const { data, error } = await supabase
            .from('rag_conversations')
            .insert({
              user_id: user.id,
              persona,
              messages
            })
            .select('id')
            .single()

          if (error) throw error
          if (data) setConversationId(data.id)
        }
      } catch (error) {
        console.error('Error saving messages:', error)
        toast({
          title: 'Error saving conversation',
          description: 'Your messages could not be saved',
          variant: 'destructive'
        })
      }
    }

    saveMessages()
  }, [messages, conversationId, persona, supabase, toast])

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: content,
          persona 
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }
      
      const data = await response.json()
      if (!data.answer) {
        throw new Error('No answer in response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error in sendMessage:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    sendMessage
  }
} 