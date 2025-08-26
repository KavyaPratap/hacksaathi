-- This function safely sends a team invitation.
-- It checks for existing membership or pending invites before creating a new one.
create or replace function public.send_team_invite(p_team_id uuid, p_invited_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  team_owner_id uuid;
  team_details record;
  sender_details record;
begin
  -- 1. Authorization: Only the team owner can send invites.
  select owner_id into team_owner_id from public.teams where id = p_team_id;
  
  if team_owner_id is null then
    raise exception 'Team not found.';
  end if;

  if team_owner_id <> current_user_id then
    raise exception 'Only the team owner can send invitations.';
  end if;

  -- 2. Check for existing membership.
  if exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_invited_user_id
  ) then
    -- User is already a member, so we don't need to do anything.
    -- You could raise an exception here if you want to notify the owner.
    -- raise exception 'User is already a member of this team.';
    return;
  end if;

  -- 3. Check for existing 'pending' or 'invited' request.
  if exists (
    select 1 from public.team_join_requests
    where team_id = p_team_id 
      and user_id = p_invited_user_id 
      and status in ('pending', 'invited')
  ) then
    -- An active request or invitation already exists.
    -- raise exception 'An active invitation for this user and team already exists.';
    return;
  end if;

  -- 4. Get team and sender details for the notification.
  select name into team_details from public.teams where id = p_team_id;
  select full_name into sender_details from public.users where id = current_user_id;

  -- 5. Create the 'invited' join request. This acts as the source of truth.
  insert into public.team_join_requests(team_id, user_id, status, proposal)
  values (p_team_id, p_invited_user_id, 'invited', 'Invited by ' || sender_details.full_name);

  -- 6. Create the notification for the user being invited.
  insert into public.notifications(user_id, type, data)
  values (p_invited_user_id, 'team_invite', jsonb_build_object(
    'team_id', p_team_id,
    'team_name', team_details.name,
    'sender_id', current_user_id,
    'sender_name', sender_details.full_name
  ));

end;
$$;

-- Drop the old function as it's being replaced by the more robust send_team_invite
drop function if exists public.create_team_invite_notification(uuid, uuid, text, uuid, text);
