"use client"

import { useParams } from "next/navigation"
import { Hash } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function ChannelPage() {
  const params = useParams()
  const channelId = params.channelId as string

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          <span className="font-semibold">{channelId}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {/* Messages will go here */}
      </div>
      <div className="border-t p-4">
        <form className="flex gap-2">
          <Textarea
            placeholder={`Message #${channelId}`}
            className="min-h-[44px] w-full resize-none"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  )
} 