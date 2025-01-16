import { notFound } from 'next/navigation'
import { type PersonaType } from '@/types/rag'
import { RagChatClient } from './rag-chat-client'

const VALID_PERSONAS = ['teacher', 'student', 'expert', 'casual', 'mentor', 'austinite'] as const

export default function RagChatPage({
  params,
}: {
  params: { persona: string }
}) {
  const persona = params.persona as PersonaType

  // Validate persona
  if (!VALID_PERSONAS.includes(persona)) {
    notFound()
  }

  return <RagChatClient persona={persona} />
} 