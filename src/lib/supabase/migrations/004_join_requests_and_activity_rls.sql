
-- Create the team_join_requests table
CREATE TABLE public.team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Enable RLS for the new table
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES for team_join_requests

-- 1. Users can create a request to join a team for themselves.
CREATE POLICY "Users can create their own join requests."
ON public.team_join_requests FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- 2. Users can see their own join requests.
CREATE POLICY "Users can view their own join requests."
ON public.team_join_requests FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- 3. Team owners can see all requests for their teams.
CREATE POLICY "Team owners can view requests for their teams."
ON public.team_join_requests FOR SELECT
TO authenticated
USING ( EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_join_requests.team_id AND teams.owner_id = auth.uid()
));

-- 4. Team owners can update the status of requests for their teams.
CREATE POLICY "Team owners can update join requests for their teams."
ON public.team_join_requests FOR UPDATE
TO authenticated
USING ( EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_join_requests.team_id AND teams.owner_id = auth.uid()
));

-- 5. After being approved, the new team member can be added to team_members
-- This policy allows a user to be added to a team if their request was approved.
-- The logic for this will be handled in the application code (as a transaction).
-- We need to ensure users can be inserted into team_members table by the owner.
-- The existing policy for team_members insert is already sufficient.

-- POLICY for activity_log

-- Users can only view their own activity log.
CREATE POLICY "Users can view their own activity."
ON public.activity_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
