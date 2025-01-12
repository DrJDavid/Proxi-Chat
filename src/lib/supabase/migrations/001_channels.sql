-- First, drop all existing policies
DROP POLICY IF EXISTS "Channels are viewable by all authenticated users" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Only creators can update their channels" ON channels;
DROP POLICY IF EXISTS "Only creators can delete their channels" ON channels;
DROP POLICY IF EXISTS "Channel members are viewable by all authenticated users" ON channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON channel_members;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_channel_created ON channels;

-- Create or update tables
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Channels are viewable by all authenticated users"
  ON channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only creators can update their channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete their channels"
  ON channels FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Channel members are viewable by all authenticated users"
  ON channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join channels"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON channel_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function and trigger for auto-joining creator
CREATE OR REPLACE FUNCTION public.handle_new_channel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_channel_created
  AFTER INSERT ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_channel(); 