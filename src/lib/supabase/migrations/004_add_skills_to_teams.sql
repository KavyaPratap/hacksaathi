-- Add the skills_needed column to the teams table
ALTER TABLE public.teams
ADD COLUMN skills_needed TEXT[];

-- Add a policy to allow authenticated users to see the new column
-- First, drop the existing select policy
DROP POLICY "Teams are viewable by all authenticated users." ON public.teams;

-- Then, create a new one that includes the new column
CREATE POLICY "Teams are viewable by all authenticated users." ON public.teams FOR SELECT TO authenticated USING (true);
