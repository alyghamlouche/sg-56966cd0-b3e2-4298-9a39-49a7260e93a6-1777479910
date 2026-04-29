-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create a security definer function to safely check admin status without RLS recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(admin_status, false);
END;
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update profiles"
ON profiles
FOR UPDATE
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
USING (is_admin_user(auth.uid()));