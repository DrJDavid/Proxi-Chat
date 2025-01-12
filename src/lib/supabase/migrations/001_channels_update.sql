-- Create channel_members table
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Enable RLS on channel_members
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Channel members policies
CREATE POLICY "Channel members are viewable by all authenticated users"
ON channel_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join channels"
ON channel_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id); 