-- Add edited_at column to messages table
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add index on edited_at for better query performance
CREATE INDEX idx_messages_edited_at ON messages(edited_at);

-- Add trigger to update edited_at when content is updated
CREATE OR REPLACE FUNCTION update_message_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content <> OLD.content THEN
        NEW.edited_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_edited_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_edited_at(); 