-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role TEXT CHECK (role IN ('user', 'dev', 'admin', 'founder'));

-- Set default role to 'user' for existing profiles
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Set forgedev@forge.io as founder, dev, and admin
-- Note: You'll need to run this after the user signs up, or update it with their actual user ID
-- UPDATE profiles SET role = 'founder' WHERE id = 'USER_ID_HERE';
