import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error in channels route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const { data: channel, error } = await supabase
      .from('channels')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      );
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
