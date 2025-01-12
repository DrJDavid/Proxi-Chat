"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function HomePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push("/chat")
      } else {
        router.push("/auth/login")
      }
    }

    checkSession()
  }, [router, supabase.auth])

  return null
}