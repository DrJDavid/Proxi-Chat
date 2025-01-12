import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    
    if (!status || !['online', 'offline', 'away'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updateData = {
      status,
      last_seen: status === 'offline' ? now : now,
      updated_at: now
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)

    if (error) {
      console.error('Error updating status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ status: 'success', timestamp: now })
  } catch (error) {
    console.error('Error in status update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 