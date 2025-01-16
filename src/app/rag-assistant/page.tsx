"use client"

import { RagAssistant } from '@/components/RagAssistant'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RagAssistantPage() {
  const router = useRouter()

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/chat')}
            title="Back to Home"
          >
            <Home className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Gauntlet AI Assistant</h2>
        </div>
        <div className="h-[calc(100vh-10rem)]">
          <RagAssistant />
        </div>
      </div>
    </div>
  )
} 