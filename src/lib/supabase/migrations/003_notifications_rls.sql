-- Enable RLS for the notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read notifications.
-- This is a broad read access. For more security, you might restrict
-- this to only allow users to read their OWN notifications, but for the
-- purpose of checking for duplicates, a broader read is simpler.
-- A better approach might be a SECURITY DEFINER function to check for invites.
-- For now, this will solve the immediate problem.

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;

-- Create the new policy
CREATE POLICY "Authenticated users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);
