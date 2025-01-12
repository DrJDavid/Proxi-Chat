"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Hash, MessageSquare, Search, Users } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreateChannel } from "./create-channel"
import { channelApi } from "@/lib/api/channels"
import { type Channel } from "@/types"
import { toast } from "sonner"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const params = useParams()
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchChannels = useCallback(async () => {
    try {
      const channels = await channelApi.getChannels()
      setChannels(channels)
    } catch (error) {
      console.error('Error fetching channels:', error)
      toast.error('Failed to load channels')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  return (
    <div className={cn("flex h-full w-60 flex-col border-r bg-muted/10", className)}>
      <div className="flex-1 overflow-auto py-2">
        <div className="px-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              All Channels
            </Button>
          </div>
        </div>
        <div className="px-2 py-2">
          <h2 className="relative px-2 text-lg font-semibold tracking-tight">
            Channels
            <Search className="absolute right-2 top-1 h-4 w-4 text-muted-foreground" />
          </h2>
          <div className="space-y-1 py-2">
            <CreateChannel onChannelCreated={fetchChannels} />
            {isLoading ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                Loading channels...
              </div>
            ) : channels.length === 0 ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                No channels yet
              </div>
            ) : (
              channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={channel.name === params?.channelId ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/chat/channels/${channel.name}`}>
                    <Hash className="mr-2 h-4 w-4" />
                    {channel.name}
                    {channel.description && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {channel.description}
                      </span>
                    )}
                  </Link>
                </Button>
              ))
            )}
          </div>
        </div>
        <div className="px-2 py-2">
          <h2 className="relative px-2 text-lg font-semibold tracking-tight">
            Direct Messages
            <Users className="absolute right-2 top-1 h-4 w-4 text-muted-foreground" />
          </h2>
          <div className="space-y-1 py-2">
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 