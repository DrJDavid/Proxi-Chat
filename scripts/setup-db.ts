import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Enable vector extension
    await supabase.rpc('setup_vector_extension');
    console.log('✅ Vector extension enabled');

    // Create message_embeddings table
    const { error: tableError } = await supabase.from('message_embeddings').select().limit(1);
    if (tableError) {
      await supabase.rpc('setup_message_embeddings_table');
      console.log('✅ Message embeddings table created');
    } else {
      console.log('ℹ️ Message embeddings table already exists');
    }

    // Create similarity search function
    await supabase.rpc('setup_match_messages_function');
    console.log('✅ Similarity search function created');

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 