-- Enable RLS for notifications table
alter table public.notifications enable row level security;

-- Allow users to see and manage their own notifications
create policy "Users can view their own notifications." on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications." on public.notifications
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notifications." on public.notifications
  for delete using (auth.uid() = user_id);
  
-- This function allows an authenticated user to create a notification for another user,
-- specifically for team invitations. It runs with the security rights of the definer (the admin role that creates it),
-- which bypasses the standard RLS insert policy for this specific, controlled action.
create or replace function public.create_team_invite_notification(
    p_user_id uuid,
    p_team_id uuid,
    p_team_name text,
    p_sender_id uuid,
    p_sender_name text
)
returns void
language plpgsql
security definer -- IMPORTANT: This makes the function run with elevated privileges
set search_path = public
as $$
declare
  notification_exists boolean;
begin
  -- Check if an unread invite notification from this sender for this team already exists
  select exists (
    select 1
    from public.notifications
    where
      user_id = p_user_id and
      type = 'team_invite' and
      is_read = false and
      (data->>'team_id')::uuid = p_team_id and
      (data->>'sender_id')::uuid = p_sender_id
  ) into notification_exists;

  -- If it exists, raise an exception
  if notification_exists then
    raise exception 'An invitation has already been sent to this user for this team.';
  end if;

  -- If no existing notification, insert the new one
  insert into public.notifications (user_id, type, data)
  values (
    p_user_id,
    'team_invite',
    jsonb_build_object(
        'team_id', p_team_id,
        'team_name', p_team_name,
        'sender_id', p_sender_id,
        'sender_name', p_sender_name
    )
  );
end;
$$;

-- Grant execute permission on the function to authenticated users
grant execute on function public.create_team_invite_notification(uuid, uuid, text, uuid, text) to authenticated;
