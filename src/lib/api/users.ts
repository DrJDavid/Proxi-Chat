import supabase from '@/lib/supabase/client'
import { type User } from '@/types'

export const userApi = {
  async fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username')

    if (error) throw error
    return data as User[]
  },

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away') {
    const { error } = await supabase
      .from('users')
      .update({ status, last_seen: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  }
} 