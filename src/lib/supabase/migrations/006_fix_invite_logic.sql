-- Add a 'type' column to distinguish between invites and requests.
ALTER TABLE public.team_join_requests
ADD COLUMN type TEXT NOT NULL DEFAULT 'join_request' CHECK (type IN ('join_request', 'invitation'));

-- Drop the old, flawed invite function if it exists
DROP FUNCTION IF EXISTS public.invite_user_to_team(uuid, uuid);

-- Create a new, corrected function for team owners to invite users.
CREATE OR REPLACE FUNCTION public.invite_user_to_team(p_invited_user_id UUID, p_team_id UUID)
RETURNS void AS $$
DECLARE
    v_owner_id UUID;
    v_team_name TEXT;
    v_sender_name TEXT;
BEGIN
    -- 1. Check if the inviter is the team owner
    SELECT owner_id INTO v_owner_id FROM public.teams WHERE id = p_team_id;

    IF v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the team owner can send invitations.';
    END IF;

    -- 2. Check if the user is already a member
    IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_invited_user_id) THEN
        RAISE EXCEPTION 'This user is already a member of the team.';
    END IF;

    -- 3. Check for an existing pending INVITATION (to avoid duplicates)
    IF EXISTS (
        SELECT 1 FROM public.team_join_requests 
        WHERE team_id = p_team_id AND user_id = p_invited_user_id AND status = 'pending' AND type = 'invitation'
    ) THEN
        RAISE EXCEPTION 'An invitation has already been sent to this user for this team.';
    END IF;

    -- 4. Create the invitation record
    INSERT INTO public.team_join_requests (team_id, user_id, status, type)
    VALUES (p_team_id, p_invited_user_id, 'pending', 'invitation');

    -- 5. Create a notification for the invited user
    SELECT name INTO v_team_name FROM public.teams WHERE id = p_team_id;
    SELECT full_name INTO v_sender_name FROM public.users WHERE id = auth.uid();

    INSERT INTO public.notifications (user_id, type, data)
    VALUES (
        p_invited_user_id,
        'team_invite',
        jsonb_build_object(
            'team_id', p_team_id,
            'team_name', v_team_name,
            'sender_id', auth.uid(),
            'sender_name', v_sender_name
        )
    );

    -- 6. Create an activity log for the owner
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
        auth.uid(),
        'invited user to',
        jsonb_build_object(
            'to_user_id', p_invited_user_id,
            'team_name', v_team_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_user_to_team(UUID, UUID) TO authenticated;

    