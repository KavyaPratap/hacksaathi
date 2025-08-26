-- Enable RLS for the activity_log table
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert their own activity.
CREATE POLICY "Users can insert their own activity."
ON public.activity_log FOR INSERT
TO authenticated WITH CHECK ( auth.uid() = user_id );

-- Policy: Allow users to view their own activity.
CREATE POLICY "Users can view their own activity."
ON public.activity_log FOR SELECT
TO authenticated USING ( auth.uid() = user_id );

-- Policy: Allow users to view activity from their teammates
CREATE POLICY "Users can view their teammates activity."
ON public.activity_log FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = activity_log.user_id
  )
);
