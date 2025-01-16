'use client'

import { type PersonaType } from '@/types/rag'
import { RagAssistant } from '@/components/RagAssistant'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RagChatClientProps {
  persona: PersonaType
}

export function RagChatClient({ persona }: RagChatClientProps) {
  const router = useRouter()

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
        <RagAssistant initialPersona={persona} />
      </div>
    </div>
  )
} 