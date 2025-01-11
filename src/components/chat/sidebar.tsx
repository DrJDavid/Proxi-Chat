"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Hash, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()
  const channels = [
    { id: "general", name: "General" },
    { id: "random", name: "Random" },
    { id: "introductions", name: "Introductions" },
  ]

  return (
    <div className={cn("flex h-full w-[200px] flex-col bg-muted/50", className)} {...props}>
      <div className="flex h-[60px] items-center border-b px-2">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Channel
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <div className="space-y-1 px-2">
          {channels.map((channel) => (
            <Tooltip key={channel.id}>
              <TooltipTrigger asChild>
                <Link
                  href={`/chat/channels/${channel.id}`}
                  className={cn(
                    "group flex h-10 w-full items-center rounded-md px-2 hover:bg-accent",
                    pathname === `/chat/channels/${channel.id}` &&
                      "bg-accent"
                  )}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  <span className="line-clamp-1 flex-1">
                    {channel.name}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {channel.name}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
} 