import supabase from '@/lib/supabase/client'
import { type Message, type User } from '@/types'

export const searchApi = {
  async search(query: string) {
    // Return empty results for empty queries
    if (!query || query.trim().length < 2) {
      return { messages: [], users: [] }
    }

    try {
      // Message search
      console.log('Executing message search for:', query)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          edited_at,
          channel_id,
          sender_id,
          sender:sender_id (
            id,
            username,
            avatar_url,
            created_at
          )
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('Raw message results:', messages)
      console.log('Message error:', messagesError)

      if (messagesError) {
        console.error('Message search error:', messagesError)
        return { messages: [], users: [] }
      }

      // User search
      console.log('Executing user search for:', query)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at, full_name')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5)

      console.log('Raw user results:', users)
      console.log('User error:', usersError)

      if (usersError) {
        console.error('User search error:', usersError)
        return { messages: [], users: [] }
      }

      // Transform messages to match our expected format
      const transformedMessages = messages?.map(msg => ({
        ...msg,
        user: msg.sender
      })) || []

      console.log('Transformed messages:', transformedMessages)

      return {
        messages: transformedMessages,
        users: users || []
      }
    } catch (error) {
      console.error('Search error:', error)
      return { messages: [], users: [] }
    }
  }
} 