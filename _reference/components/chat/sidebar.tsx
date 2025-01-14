'use client'

import * as React from 'react'
import Link from 'next/link'
import { Hash, Users, Plus, Search, MessagesSquare } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Channel {
  id: string
  name: string
  unread: number
}

interface DirectMessage {
  id: string
  name: string
  avatar: string
  online: boolean
  lastMessage: string
}

// Sample data
const channels: Channel[] = [
  { id: '1', name: 'general', unread: 2 },
  { id: '2', name: 'random', unread: 0 },
  { id: '3', name: 'development', unread: 5 },
]

const directMessages: DirectMessage[] = [
  {
    id: '1',
    name: 'Alice Smith',
    avatar: '/placeholder.svg?height=32&width=32',
    online: true,
    lastMessage: 'Hey, how are you?',
  },
  {
    id: '2',
    name: 'Bob Johnson',
    avatar: '/placeholder.svg?height=32&width=32',
    online: false,
    lastMessage: 'Can you check this PR?',
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const pathname = usePathname()

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "pb-12 min-h-screen",
          isCollapsed ? "w-[80px]" : "w-[300px]",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight">
                Overview
              </h2>
              <div className="space-y-1">
                <TooltipProvider delayDuration={0}>
                  <div className="grid gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start",
                            !isCollapsed && "px-2",
                            isCollapsed && "justify-center px-0"
                          )}
                        >
                          <MessagesSquare className="h-5 w-5" />
                          {!isCollapsed && <span className="ml-2">All Channels</span>}
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="flex items-center gap-4">
                          All Channels
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="px-4 text-lg font-semibold tracking-tight">
                {!isCollapsed && "Channels"}
              </h2>
              {!isCollapsed && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add channel</span>
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {!isCollapsed && (
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search channels..." />
                  <CommandList>
                    <CommandEmpty>No channels found.</CommandEmpty>
                    <CommandGroup>
                      {channels.map((channel) => (
                        <CommandItem
                          key={channel.id}
                          className="cursor-pointer"
                          onSelect={() => {}}
                        >
                          <Link
                            href={`/chat/channels/${channel.name}`}
                            className={cn(
                              "flex items-center w-full",
                              pathname === `/chat/channels/${channel.name}` && "font-bold"
                            )}
                          >
                            <Hash className="mr-2 h-4 w-4" />
                            <span>{channel.name}</span>
                            {channel.unread > 0 && (
                              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                {channel.unread}
                              </span>
                            )}
                          </Link>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
              {isCollapsed && (
                <div className="grid gap-1">
                  <TooltipProvider delayDuration={0}>
                    {channels.map((channel) => (
                      <Tooltip key={channel.id}>
                        <TooltipTrigger asChild>
                          <Link href={`/chat/channels/${channel.name}`}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-center px-0",
                                pathname === `/chat/channels/${channel.name}` && "bg-muted"
                              )}
                            >
                              <Hash className="h-5 w-5" />
                              {channel.unread > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                  {channel.unread}
                                </span>
                              )}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-4">
                          #{channel.name}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="px-4 text-lg font-semibold tracking-tight">
                {!isCollapsed && "Direct Messages"}
              </h2>
              {!isCollapsed && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Users className="h-4 w-4" />
                  <span className="sr-only">New message</span>
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {!isCollapsed && (
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search people..." />
                  <CommandList>
                    <CommandEmpty>No people found.</CommandEmpty>
                    <CommandGroup>
                      {directMessages.map((dm) => (
                        <CommandItem
                          key={dm.id}
                          className="cursor-pointer"
                          onSelect={() => {}}
                        >
                          <div className="relative mr-2">
                            <img
                              src={dm.avatar}
                              alt=""
                              className="rounded-full w-6 h-6"
                            />
                            {dm.online && (
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
                            )}
                          </div>
                          <span>{dm.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
              {isCollapsed && (
                <div className="grid gap-1">
                  <TooltipProvider delayDuration={0}>
                    {directMessages.map((dm) => (
                      <Tooltip key={dm.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-center px-0"
                          >
                            <div className="relative">
                              <img
                                src={dm.avatar}
                                alt=""
                                className="rounded-full w-6 h-6"
                              />
                              {dm.online && (
                                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
                              )}
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-4">
                          {dm.name}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="secondary"
        className={cn(
          "absolute -right-4 top-4 z-40 h-8 w-8 rounded-full",
          isCollapsed && "rotate-180"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="sr-only">
          {isCollapsed ? "Expand" : "Collapse"} sidebar
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Button>
    </div>
  )
}

