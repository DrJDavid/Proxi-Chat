import { RagAssistant } from '@/components/RagAssistant'

export default function RagAssistantPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Gauntlet AI Assistant</h2>
        </div>
        <div className="h-[calc(100vh-10rem)]">
          <RagAssistant />
        </div>
      </div>
    </div>
  )
} 