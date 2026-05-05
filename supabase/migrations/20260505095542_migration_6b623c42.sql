-- Drop all problematic self-referencing policies on profiles table
DROP POLICY IF EXISTS "admins_all" ON profiles;
DROP POLICY IF EXISTS "admins_can_delete" ON profiles;
DROP POLICY IF EXISTS "admins_can_insert" ON profiles;
DROP POLICY IF EXISTS "admins_can_update" ON profiles;
DROP POLICY IF EXISTS "admins_can_view_all" ON profiles;

-- Drop policies using is_admin_user() function (likely also causes recursion)
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Drop duplicate SELECT policies, keep only one simple one
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_select_own" ON profiles;

-- Create clean, simple SELECT policy (no self-reference)
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- For admin operations, we'll rely on service role or handle via backend
-- No RLS policies needed for INSERT/UPDATE/DELETE since users shouldn't directly modify profiles
-- Admin operations should use service role keys in the backend