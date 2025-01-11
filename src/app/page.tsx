'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(1)
        
        if (!isMounted) return

        if (error) {
          console.error('Supabase error details:', {
            code: error.code,
            message: error.message,
            details: error.details
          })
          throw error
        }
        
        setIsConnected(true)
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) return
        
        if (error instanceof Error) {
          console.error('Error details:', error)
          setErrorMessage(`Connection error: ${error.message}`)
        } else {
          setErrorMessage('Failed to connect to the database')
        }
        setIsConnected(false)
      }
    }

    testConnection()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-2xl">
        {isConnected === null && 'Testing connection...'}
        {isConnected === true && '✅ Connected to Supabase!'}
        {isConnected === false && (
          <div className="text-red-500">
            <p>❌ Connection failed</p>
            {errorMessage && (
              <p className="text-sm mt-2 whitespace-pre-wrap">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}