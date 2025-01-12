"use client"

import { TopNav } from "@/components/chat/top-nav"
import { Sidebar } from "@/components/chat/sidebar"

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        {children}
      </div>
    </div>
  )
} 