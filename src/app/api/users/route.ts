import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import supabase from '@/lib/supabase/client'

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at, full_name')
      .order('username')

    if (error) throw error

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    const body = await request.json()
    const { username, full_name, avatar_url } = body

    const { data, error } = await supabase
      .from('users')
      .update({ username, full_name, avatar_url })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
