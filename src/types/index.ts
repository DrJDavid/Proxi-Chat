export interface User {
  id: string
  username: string
  avatar_url?: string
  created_at: string
  online?: boolean
  status?: 'online' | 'offline' | 'away'
}

export interface Channel {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
  member_count?: number
}

export interface ChannelMember {
  channel_id: string
  user_id: string
  joined_at: string
  user?: User
}

export interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  receiver_id: string | null
  parent_message_id: string | null
  has_attachment: boolean
  created_at: string
  user?: User
  reactions?: Reaction[]
  reply_count?: number
}

export interface Attachment {
  id: string
  message_id: string
  file_path: string
  file_type: string
}

export interface Reaction {
  id: string
  emoji: string
  user_id: string
  message_id: string
  created_at: string
  user: User
}
