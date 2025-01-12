"use client"

import { useState, useEffect } from "react"

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number = 3000,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const poll = async () => {
      try {
        setIsLoading(true)
        const result = await fetchFn()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    poll()

    // Set up polling interval
    const intervalId = setInterval(poll, interval)

    // Cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchFn, interval, enabled])

  return { data, error, isLoading }
} 