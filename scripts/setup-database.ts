import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import type { Database } from '@/lib/database.types';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    // Enable pgvector extension
    const { error: extensionError } = await supabase.from('extensions').select('*');
    if (extensionError) {
      console.error('Error checking extensions:', extensionError);
      return;
    }

    // Create documents table
    const { error: tableError } = await supabase.rpc('create_documents_table');
    if (tableError) {
      console.error('Error creating documents table:', tableError);
      return;
    }

    // Create match_documents function
    const { error: functionError } = await supabase.rpc('create_match_documents_function');
    if (functionError) {
      console.error('Error creating match_documents function:', functionError);
      return;
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase(); 