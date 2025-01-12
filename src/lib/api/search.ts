import supabase from '@/lib/supabase/client'
import { type Message, type User } from '@/types'

export interface SearchResult {
  messages: Message[]
  users: User[]
}

export const searchApi = {
  async search(query: string, channelId?: string): Promise<SearchResult> {
    const searchTerm = `%${query}%`

    // Search messages
    const messageQuery = supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(20)

    // Add channel filter if provided
    if (channelId) {
      messageQuery.eq('channel_id', channelId)
    }

    // Search users
    const userQuery = supabase
      .from('users')
      .select('*')
      .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
      .limit(10)

    // Execute both queries in parallel
    const [messagesResult, usersResult] = await Promise.all([
      messageQuery,
      userQuery
    ])

    if (messagesResult.error) throw messagesResult.error
    if (usersResult.error) throw usersResult.error

    return {
      messages: messagesResult.data as Message[],
      users: usersResult.data as User[]
    }
  }
} 