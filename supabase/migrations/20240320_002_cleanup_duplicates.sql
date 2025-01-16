-- Function to cleanup duplicate documents
create or replace function cleanup_duplicate_documents()
returns table (
  total_before bigint,
  total_after bigint,
  duplicates_removed bigint,
  unique_files bigint
) language plpgsql as $$
declare
  before_count bigint;
  after_count bigint;
  unique_files_count bigint;
begin
  -- Get initial counts
  select count(*) into before_count from documents;
  select count(distinct metadata->>'filename') into unique_files_count from documents;
  
  -- Delete duplicates keeping the most recent version
  with duplicates as (
    select 
      id,
      content,
      metadata->>'filename' as filename,
      row_number() over (
        partition by content, metadata->>'filename'
        order by created_at desc
      ) as rn
    from documents
  )
  delete from documents d
  using duplicates dup
  where d.id = dup.id
  and dup.rn > 1;

  -- Get final count
  select count(*) into after_count from documents;
  
  return query
  select 
    before_count as total_before,
    after_count as total_after,
    (before_count - after_count) as duplicates_removed,
    unique_files_count as unique_files;
end;
$$; 