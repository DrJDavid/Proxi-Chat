-- Check tables
SELECT 
    table_name,
    array_agg(column_name || ' ' || data_type) as columns
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('users', 'channels', 'channel_members')
GROUP BY 
    table_name;

-- Check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename, policyname;

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
ORDER BY 
    event_object_table, trigger_name; 