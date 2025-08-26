-- Add the missing foreign key constraint to the team_join_requests table
ALTER TABLE public.team_join_requests
ADD CONSTRAINT team_join_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add a foreign key constraint for the team_id as well for data integrity
ALTER TABLE public.team_join_requests
ADD CONSTRAINT team_join_requests_team_id_fkey
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
