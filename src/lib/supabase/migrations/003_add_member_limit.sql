-- Add a member_limit column to the teams table with a default value of 5.
ALTER TABLE public.teams
ADD COLUMN member_limit INTEGER DEFAULT 5;
