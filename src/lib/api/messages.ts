import supabase from '@/lib/supabase/client'
import { type Message, type Reaction } from '@/types'

export const messageApi = {
  async fetchMessages(channelId: string, options: {
    limit?: number,
    cursor?: string,
  } = {}) {
    const { limit = 50, cursor } = options
    
    let query = supabase
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
      .eq('channel_id', channelId)
      .is('parent_message_id', null) // Only fetch top-level messages
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: messages, error } = await query
    if (error) throw error

    // Fetch reply counts for each message
    if (messages && messages.length > 0) {
      const replyCounts = await Promise.all(
        messages.map(async (message) => {
          const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('parent_message_id', message.id)

          if (error) throw error
          return { messageId: message.id, count }
        })
      )

      // Add reply counts to messages
      const messagesWithReplyCounts = messages.map(message => ({
        ...message,
        reply_count: replyCounts.find(rc => rc.messageId === message.id)?.count || 0
      }))

      return messagesWithReplyCounts as Message[]
    }

    return messages as Message[]
  },

  async sendMessage({ content, channelId, senderId, receiverId, parentMessageId }: {
    content: string
    channelId?: string
    senderId: string
    receiverId?: string
    parentMessageId?: string
  }) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
        sender_id: senderId,
        receiver_id: receiverId,
        parent_message_id: parentMessageId,
        has_attachment: false,
        created_at: now
      })
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
      .single()

    if (error) throw error
    return { ...data, reply_count: 0 } as Message
  },

  async addReaction({ messageId, userId, emoji }: {
    messageId: string
    userId: string
    emoji: string
  }) {
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single()

    if (existingReaction) {
      // Remove reaction if it already exists
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (error) throw error
      return
    }

    // Add new reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji
      })
      .select(`
        *,
        user:users!user_id(
          id,
          username,
          full_name,
          avatar_url,
          status
        )
      `)
      .single()

    if (error) throw error
    return data as Reaction
  },

  async getThreadMessages(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(
          id,
          username,
          full_name,
          avatar_url,
          status
        ),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('parent_message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  }
} 