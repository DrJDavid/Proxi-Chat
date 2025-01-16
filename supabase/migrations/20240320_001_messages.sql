-- Add agent-related columns to messages table
alter table public.messages 
add column if not exists is_agent boolean default false,
add column if not exists agent_persona text check (agent_persona in ('teacher', 'student', 'expert', 'casual', 'mentor', 'austinite'));

-- Refresh schema cache
notify pgrst, 'reload schema'; 