-- Fix user_api_keys table to accept string user IDs instead of UUIDs
-- This allows the frontend to use stable user IDs based on email hashes

-- First, drop the existing table constraints
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_user_id_fkey;

-- Change the user_id column from UUID to TEXT
ALTER TABLE user_api_keys 
ALTER COLUMN user_id TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
ORDER BY ordinal_position;
