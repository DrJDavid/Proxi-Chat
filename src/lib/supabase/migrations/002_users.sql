-- Add status and last_seen columns to users table if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Update RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read all user data
CREATE POLICY "Users are viewable by all authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own status
CREATE POLICY "Users can update their own status"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 