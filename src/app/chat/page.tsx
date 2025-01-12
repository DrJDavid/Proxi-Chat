"use client"

import { ChannelList } from '@/components/chat/channel-list'

export default function ChatPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Welcome to ProxiChat</h1>
      <p className="text-muted-foreground mb-8">Join channels to start chatting with others.</p>
      <ChannelList />
    </main>
  )
} 