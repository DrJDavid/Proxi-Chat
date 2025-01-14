-- Drop the existing function first
drop function if exists cleanup_duplicate_documents();

-- Function to clean up duplicate documents and return statistics
create or replace function cleanup_duplicate_documents()
returns table (
  total_before int,
  total_after int,
  duplicates_removed int,
  unique_files int
)
language plpgsql
as $$
declare
  total_count int;
  final_count int;
  unique_files_count int;
begin
  -- Get initial count
  select count(*) into total_count from documents;
  
  -- Get count of unique files
  select count(distinct metadata->>'filename') into unique_files_count from documents;

  -- Create a temporary table with the rows we want to keep
  create temp table docs_to_keep as
  select distinct on (content) id
  from documents
  order by content, created_at desc;

  -- Delete all rows that are not in our temporary table
  delete from documents
  where id not in (select id from docs_to_keep);

  -- Get final count
  select count(*) into final_count from documents;

  -- Drop the temporary table
  drop table docs_to_keep;

  -- Return statistics
  return query
  select 
    total_count as total_before,
    final_count as total_after,
    (total_count - final_count) as duplicates_removed,
    unique_files_count as unique_files;
end;
$$; 