-- Add a column to track if the user has completed the product tour
ALTER TABLE public.users
ADD COLUMN has_completed_tour BOOLEAN DEFAULT false;

-- The existing policy "Users can update their own profile." allows users to update this column for themselves.
-- No new policy is needed as long as that one exists.
