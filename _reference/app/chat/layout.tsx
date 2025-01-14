'use client'

import { TopNav } from '@/components/chat/top-nav'
import { Sidebar } from '@/components/chat/sidebar'
import { ReactNode } from 'react'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

