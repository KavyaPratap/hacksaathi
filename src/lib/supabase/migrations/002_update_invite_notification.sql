-- Update the existing RPC function to include team_id in the notification data payload
-- and to prevent duplicate pending invites.

CREATE OR REPLACE FUNCTION create_team_invite_notification(
    p_user_id UUID,
    p_team_id UUID,
    p_team_name TEXT,
    p_sender_id UUID,
    p_sender_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_pending_invite_id UUID;
BEGIN
    -- Check if a pending invitation already exists for this user and team.
    SELECT id INTO existing_pending_invite_id
    FROM public.team_join_requests
    WHERE user_id = p_user_id
      AND team_id = p_team_id
      AND status = 'pending'
    LIMIT 1;

    -- If a pending invite does not exist, create one.
    IF existing_pending_invite_id IS NULL THEN
        -- Insert a record into team_join_requests to track the invite
        INSERT INTO public.team_join_requests (team_id, user_id, status)
        VALUES (p_team_id, p_user_id, 'pending');

        -- Insert the notification for the recipient
        INSERT INTO public.notifications (user_id, type, data)
        VALUES (
            p_user_id,
            'team_invite',
            jsonb_build_object(
                'team_id', p_team_id, -- Ensure team_id is included
                'team_name', p_team_name,
                'sender_id', p_sender_id,
                'sender_name', p_sender_name
            )
        );
    ELSE
        -- Optionally, you could raise an exception or do nothing if an invite already exists.
        -- For now, we do nothing to prevent errors on the frontend for duplicate clicks.
    END IF;
END;
$$;
