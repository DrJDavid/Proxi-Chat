import { type ReactNode } from 'react'

export default function RagChatLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  )
}

// Metadata
export const metadata = {
  title: 'Chat with AI Assistant',
  description: 'Have a conversation with our AI assistant'
} 