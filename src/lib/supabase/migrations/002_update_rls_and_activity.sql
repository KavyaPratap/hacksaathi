
-- Enable RLS for activity_log table
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.activity_log FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to view all activity
CREATE POLICY "Users can view all activity"
ON public.activity_log FOR SELECT
TO authenticated USING (true);

-- Allow any authenticated user to add themselves to a team
-- This is crucial for accepting invitations
CREATE POLICY "Authenticated users can add themselves to a team"
ON public.team_members FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);
