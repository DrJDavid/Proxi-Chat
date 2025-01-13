'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChannelList } from '@/components/chat/channel-list'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...')
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        console.log('Auth session:', session)
        if (!session) {
          console.log('No session, redirecting to login...')
          router.push('/auth/login')
          return
        }
        
        console.log('User authenticated:', session.user.id)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth error:', error)
        setError('Authentication failed')
        toast.error('Authentication failed')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Welcome to ProxiChat</h1>
      <p className="text-muted-foreground mb-8">Join channels to start chatting with others.</p>
      <ChannelList />
    </main>
  )
}