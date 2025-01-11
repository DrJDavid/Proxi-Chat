"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the general channel by default
    router.push("/chat/channels/general")
  }, [router])

  return null
} 