import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  }
});

async function setupDatabase() {
  try {
    // Enable vector extension
    const { error: vectorError } = await supabase.rpc('create_extension', {
      name: 'vector'
    });

    if (vectorError) {
      console.error('Error enabling vector extension:', vectorError);
      return;
    }
    console.log('✅ Vector extension enabled');

    // Create documents table
    const { error: tableError } = await supabase.from('_database_schema').rpc('run_sql', {
      query: `
        create table if not exists documents (
          id uuid primary key default uuid_generate_v4(),
          content text not null,
          metadata jsonb not null default '{}'::jsonb,
          embedding vector(384),
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    });

    if (tableError) {
      console.error('Error creating documents table:', tableError);
      return;
    }
    console.log('✅ Documents table created');

    // Create similarity search function
    const { error: functionError } = await supabase.from('_database_schema').rpc('run_sql', {
      query: `
        create or replace function match_documents (
          query_embedding vector(384),
          match_count int default 5
        ) returns table (
          id uuid,
          content text,
          similarity float
        )
        language plpgsql
        as $$
        begin
          return query
          select
            id,
            content,
            1 - (embedding <=> query_embedding) as similarity
          from documents
          where embedding is not null
          order by embedding <=> query_embedding
          limit match_count;
        end;
        $$;
      `
    });

    if (functionError) {
      console.error('Error creating similarity function:', functionError);
      return;
    }
    console.log('✅ Similarity search function created');

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 