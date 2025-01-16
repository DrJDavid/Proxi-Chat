import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getEmbeddings } from '@/lib/embeddings';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Generate embeddings for the search query
    const embedding = await getEmbeddings(query);

    // Perform similarity search
    const { data: similarMessages, error } = await supabase.rpc(
      'match_messages',
      {
        query_embedding: embedding,
        match_threshold: 0.7, // Adjust this threshold as needed
        match_count: 5, // Number of similar messages to return
      }
    );

    if (error) {
      console.error('Error performing similarity search:', error);
      return NextResponse.json(
        { error: 'Failed to perform search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: similarMessages });
  } catch (error) {
    console.error('Error in search route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 