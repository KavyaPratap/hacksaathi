-- Add a new column to store the proposal message with a join request
ALTER TABLE public.team_join_requests
ADD COLUMN proposal TEXT;
