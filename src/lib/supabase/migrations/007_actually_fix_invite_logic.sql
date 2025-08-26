-- Drop the old, incorrect function if it exists
DROP FUNCTION IF EXISTS invite_user_to_team;

-- Recreate the function with the corrected logic
CREATE OR REPLACE FUNCTION invite_user_to_team(p_team_id uuid, p_invited_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_current_member_count integer;
  v_member_limit integer;
  v_inviter_name text;
  v_team_name text;
BEGIN
  -- 1. Check if the current user is the owner of the team
  SELECT owner_id INTO v_owner_id FROM public.teams WHERE id = p_team_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Team not found.';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the team owner can send invitations.';
  END IF;

  -- 2. Get team details for the notification
  SELECT name, member_limit INTO v_team_name, v_member_limit FROM public.teams WHERE id = p_team_id;

  -- 3. Check if the team is full
  SELECT COUNT(*) INTO v_current_member_count FROM public.team_members WHERE team_id = p_team_id;
  IF v_current_member_count >= v_member_limit THEN
    RAISE EXCEPTION 'This team is already full and cannot accept new members.';
  END IF;

  -- 4. Check if the user is already a member
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_invited_user_id) THEN
    RAISE EXCEPTION 'This user is already a member of the team.';
  END IF;

  -- 5. Check if a pending invitation or join request already exists.
  -- This prevents duplicate entries and resolves the unique constraint violation.
  IF EXISTS (
    SELECT 1 
    FROM public.team_join_requests 
    WHERE team_id = p_team_id 
      AND user_id = p_invited_user_id 
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'An invitation or request for this user to join this team already exists.';
  END IF;
  
  -- 6. Insert the invitation record into team_join_requests, setting the type correctly
  INSERT INTO public.team_join_requests (team_id, user_id, type, status)
  VALUES (p_team_id, p_invited_user_id, 'invitation', 'pending'); -- This was the missing piece

  -- 7. Get the inviter's name for the notification
  SELECT full_name INTO v_inviter_name FROM public.users WHERE id = auth.uid();

  -- 8. Create a notification for the invited user
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    p_invited_user_id,
    'team_invite',
    jsonb_build_object(
      'team_id', p_team_id,
      'team_name', v_team_name,
      'sender_id', auth.uid(),
      'sender_name', v_inviter_name
    )
  );

  -- 9. Log the activity
  INSERT INTO public.activity_log (user_id, action, details)
  VALUES (
      auth.uid(),
      'invited a user to',
      jsonb_build_object(
          'invited_user_id', p_invited_user_id,
          'team_id', p_team_id,
          'team_name', v_team_name
      )
  );
END;
$$;
