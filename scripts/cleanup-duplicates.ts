import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('Starting cleanup...');

  try {
    // Delete duplicates and get statistics
    const { data, error } = await supabase.rpc('cleanup_duplicate_documents');

    if (error) {
      console.error('Error cleaning up duplicates:', error);
      process.exit(1);
    }

    const stats = data[0];
    console.log('\nCleanup Statistics:');
    console.log('------------------');
    console.log(`Total documents before: ${stats.total_before}`);
    console.log(`Total documents after: ${stats.total_after}`);
    console.log(`Duplicates removed: ${stats.duplicates_removed}`);
    console.log(`Unique files in database: ${stats.unique_files}`);
    console.log('\n✅ Cleanup completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates(); 