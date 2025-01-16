-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing message embeddings
create table if not exists message_embeddings (
    id uuid primary key default uuid_generate_v4(),
    message_id uuid references messages(id) on delete cascade,
    embedding vector(384), -- 384 is the dimension for all-MiniLM-L6-v2
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for similarity search
create index on message_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100); 