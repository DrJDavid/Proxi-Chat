-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table
create table if not exists documents (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    metadata jsonb not null default '{}'::jsonb,
    embedding vector(384),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the similarity search function
create or replace function match_documents (
    query_embedding vector(384),
    match_count int default 5
) returns table (
    id uuid,
    content text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        id,
        content,
        1 - (embedding <=> query_embedding) as similarity
    from documents
    where embedding is not null
    order by embedding <=> query_embedding
    limit match_count;
end;
$$; 