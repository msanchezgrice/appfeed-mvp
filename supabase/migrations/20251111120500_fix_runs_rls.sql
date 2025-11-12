-- Fix RLS policies for runs table to allow inserts

-- Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "Users can insert their own runs" ON runs;
DROP POLICY IF EXISTS "Users can view their own runs" ON runs;

-- Create new policies that work with service role
CREATE POLICY "Allow authenticated inserts" ON runs
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow authenticated selects" ON runs
  FOR SELECT
  TO authenticated, service_role
  USING (true);

-- Also fix library_saves to ensure it works
DROP POLICY IF EXISTS "Users can manage their library" ON library_saves;
DROP POLICY IF EXISTS "Users view their library" ON library_saves;

CREATE POLICY "Allow authenticated library operations" ON library_saves
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
