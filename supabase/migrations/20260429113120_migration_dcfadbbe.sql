-- Add full_name column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Ensure your account has admin access
UPDATE profiles 
SET is_admin = true, full_name = 'Aly Ghamlouche'
WHERE email = 'alyghamlouche@gmail.com';

-- Insert profile if it doesn't exist
INSERT INTO profiles (id, email, is_admin, full_name)
SELECT id, email, true, 'Aly Ghamlouche'
FROM auth.users
WHERE email = 'alyghamlouche@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true, full_name = 'Aly Ghamlouche';