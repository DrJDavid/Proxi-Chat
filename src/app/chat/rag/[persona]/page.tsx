"use client"

import { notFound } from 'next/navigation'
import { type PersonaType } from '@/types/rag'
import { RagAssistant } from '@/components/RagAssistant'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

const VALID_PERSONAS = ['teacher', 'student', 'expert', 'casual', 'mentor', 'austinite'] as const

interface RagChatPageProps {
  params: {
    persona: string
  }
}

export default function RagChatPage({ params }: RagChatPageProps) {
  const router = useRouter()

  // Validate persona
  if (!VALID_PERSONAS.includes(params.persona as PersonaType)) {
    notFound()
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/chat')}
          title="Back to Home"
        >
          <Home className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Chat with AI Assistant</h2>
      </div>
      <div className="flex-1">
        <RagAssistant initialPersona={params.persona as PersonaType} />
      </div>
    </div>
  )
} 