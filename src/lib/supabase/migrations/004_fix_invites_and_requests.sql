-- Migration to fix team join requests and invitations

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS public.send_team_invite(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_chat_notification(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.request_to_join_team(uuid, text);
DROP FUNCTION IF EXISTS public.invite_user_to_team(uuid, uuid);

-- Drop existing table and re-create with correct constraints
DROP TABLE IF EXISTS public.team_join_requests;

CREATE TABLE public.team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    proposal TEXT, -- Optional message from user when requesting
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a partial unique index to ensure a user can only have one PENDING request per team
CREATE UNIQUE INDEX team_join_requests_pending_unique 
ON public.team_join_requests (team_id, user_id) 
WHERE (status = 'pending');


-- Policies for team_join_requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests.
CREATE POLICY "Users can view their own join requests."
ON public.team_join_requests FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- Team owners can see requests for their teams.
CREATE POLICY "Team owners can view requests for their teams."
ON public.team_join_requests FOR SELECT
TO authenticated USING (EXISTS (
    SELECT 1 FROM teams WHERE teams.id = team_join_requests.team_id AND teams.owner_id = auth.uid()
));

-- Users can create their own requests to join.
CREATE POLICY "Users can create their own join requests."
ON public.team_join_requests FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Team owners can update the status of requests for their teams (approve/decline).
CREATE POLICY "Team owners can update request status."
ON public.team_join_requests FOR UPDATE
TO authenticated USING (EXISTS (
    SELECT 1 FROM teams WHERE teams.id = team_join_requests.team_id AND teams.owner_id = auth.uid()
));


-- Function for a user to request to join a team
CREATE OR REPLACE FUNCTION public.request_to_join_team(p_team_id UUID, p_proposal TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  team_owner_id UUID;
BEGIN
  -- Ensure user is not already a member
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already a member of this team.';
  END IF;

  -- Ensure user does not already have a pending request
  IF EXISTS (SELECT 1 FROM public.team_join_requests WHERE team_id = p_team_id AND user_id = v_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'You have already sent a request to join this team.';
  END IF;

  -- Insert the join request
  INSERT INTO public.team_join_requests (team_id, user_id, proposal)
  VALUES (p_team_id, v_user_id, p_proposal);

  -- Get team owner to create a notification for them
  SELECT owner_id INTO team_owner_id FROM public.teams WHERE id = p_team_id;
  
  -- Create a notification for the team owner
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    team_owner_id,
    'team_invite',
    jsonb_build_object(
      'type', 'join_request',
      'team_id', p_team_id,
      'team_name', (SELECT name FROM teams WHERE id = p_team_id),
      'sender_id', v_user_id,
      'sender_name', (SELECT full_name FROM users WHERE id = v_user_id)
    )
  );
END;
$$;


-- Function for a team owner to invite a user
CREATE OR REPLACE FUNCTION public.invite_user_to_team(p_team_id UUID, p_invited_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID := auth.uid();
BEGIN
  -- Ensure the inviter is the owner of the team
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = v_owner_id) THEN
    RAISE EXCEPTION 'Only the team owner can send invitations.';
  END IF;
  
  -- Ensure user is not already a member
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_invited_user_id) THEN
    RAISE EXCEPTION 'This user is already a member of the team.';
  END IF;

  -- Ensure a pending invite doesn't already exist
  IF EXISTS (SELECT 1 FROM public.team_join_requests WHERE team_id = p_team_id AND user_id = p_invited_user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'An invitation has already been sent to this user for this team.';
  END IF;

  -- Insert the request, initiated by the owner
  INSERT INTO public.team_join_requests (team_id, user_id, status, proposal)
  VALUES (p_team_id, p_invited_user_id, 'pending', 'Invited by team owner.');

  -- Create a notification for the invited user
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    p_invited_user_id,
    'team_invite',
    jsonb_build_object(
      'type', 'invitation',
      'team_id', p_team_id,
      'team_name', (SELECT name FROM teams WHERE id = p_team_id),
      'sender_id', v_owner_id,
      'sender_name', (SELECT full_name FROM users WHERE id = v_owner_id)
    )
  );
END;
$$;