import supabase from '@/lib/supabase/client'
import { type Message, type User } from '@/types'

export interface SearchResult {
  messages: Message[]
  users: User[]
}

export const searchApi = {
  async search(query: string, channelId?: string): Promise<SearchResult> {
    if (!query.trim()) {
      return { messages: [], users: [] }
    }

    try {
      // Simple message search
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*, user:users!sender_id(*)')
        .ilike('content', `%${query}%`)
        .limit(20)

      if (messagesError) {
        console.error('Message search error:', messagesError)
        return { messages: [], users: [] }
      }

      // Simple user search
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10)

      if (usersError) {
        console.error('User search error:', usersError)
        return { messages: [], users: [] }
      }

      return {
        messages: messages || [],
        users: users || []
      }
    } catch (error) {
      console.error('Search error:', error)
      return { messages: [], users: [] }
    }
  }
} 