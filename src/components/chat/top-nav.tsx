"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MobileSidebar } from "@/components/chat/mobile-sidebar"

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center">
        <MobileSidebar />
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="hidden md:inline-block">ProxiChat</span>
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Add user menu here later */}
      </div>
    </header>
  )
} 