-- Rollback for 016: text -> uuid. Only safe if every user_id is a valid uuid or
-- null (Clerk ids like "user_..." are NOT uuids, so truncate the table first if
-- any non-uuid values were written, or this will error).
ALTER TABLE public.event_logs
  ALTER COLUMN user_id TYPE uuid USING NULLIF(user_id, '')::uuid;
