import { RagAssistant } from '@/components/RagAssistant'
import { notFound } from 'next/navigation'

const VALID_PERSONAS = ['teacher', 'student', 'expert', 'casual', 'mentor', 'austinite']

interface Props {
  params: {
    persona: string
  }
}

export default function RagChatPage({ params }: Props) {
  // Validate persona
  if (!VALID_PERSONAS.includes(params.persona)) {
    notFound()
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Chat with {params.persona}</h2>
        </div>
        <div className="h-[calc(100vh-10rem)]">
          <RagAssistant initialPersona={params.persona} />
        </div>
      </div>
    </div>
  )
} 