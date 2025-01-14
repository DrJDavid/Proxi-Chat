import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');
    
    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, user:users(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in messages route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { content, channelId } = body;

    if (!content || !channelId) {
      return NextResponse.json(
        { error: 'Content and channelId are required' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
      })
      .select('*, user:users(*)')
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in messages route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
