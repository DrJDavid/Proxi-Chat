import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Run migrations using Supabase CLI
    execSync('npx supabase db reset', { stdio: 'inherit' });

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 