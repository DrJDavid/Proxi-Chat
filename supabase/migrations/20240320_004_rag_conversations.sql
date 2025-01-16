-- Create the rag_conversations table
create table if not exists rag_conversations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    persona text not null check (persona in ('teacher', 'student', 'expert', 'casual', 'mentor', 'austinite')),
    messages jsonb[] not null default array[]::jsonb[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index rag_conversations_user_id_persona_idx on rag_conversations(user_id, persona);

-- Add RLS policies
alter table rag_conversations enable row level security;

create policy "Users can view their own conversations"
    on rag_conversations for select
    using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
    on rag_conversations for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
    on rag_conversations for update
    using (auth.uid() = user_id); 