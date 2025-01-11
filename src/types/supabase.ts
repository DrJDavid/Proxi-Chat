export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          status: string
          last_seen: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          status?: string
          last_seen?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          status?: string
          last_seen?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          created_by?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          channel_id: string | null
          sender_id: string
          receiver_id: string | null
          created_at: string
          has_attachment: boolean
          parent_message_id: string | null
        }
        Insert: {
          id?: string
          content: string
          channel_id?: string | null
          sender_id: string
          receiver_id?: string | null
          created_at?: string
          has_attachment?: boolean
          parent_message_id?: string | null
        }
        Update: {
          id?: string
          content?: string
          channel_id?: string | null
          sender_id?: string
          receiver_id?: string | null
          created_at?: string
          has_attachment?: boolean
          parent_message_id?: string | null
        }
      }
      attachments: {
        Row: {
          id: string
          message_id: string
          file_path: string
          file_type: string
        }
        Insert: {
          id?: string
          message_id: string
          file_path: string
          file_type: string
        }
        Update: {
          id?: string
          message_id?: string
          file_path?: string
          file_type?: string
        }
      }
      reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
    }
  }
}