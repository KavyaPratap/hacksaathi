
-- Enable the "pg_tle" extension
-- This is a one-time setup in your Supabase project.
-- Go to Database -> Extensions and enable "pg_tle".

-- Function to check if a user is a participant in a conversation
-- This is used in RLS policies to avoid infinite recursion.
create or replace function is_chat_participant(conversation_id uuid, user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from conversations
    where id = conversation_id
    and (participant_one = user_id or participant_two = user_id)
  );
end;
$$;


-- Function to get all conversations for a user with the last message
create or replace function get_conversations_with_last_message(user_id_param uuid)
returns table (
  id uuid,
  participant_one uuid,
  participant_two uuid,
  last_message_content text,
  last_message_created_at timestamptz,
  status conversation_status,
  requester_id uuid
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.participant_one,
    c.participant_two,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    c.status,
    c.requester_id
  from
    conversations c
  left join lateral (
    select
      content,
      created_at
    from
      messages
    where
      conversation_id = c.id
    order by
      created_at desc
    limit 1
  ) lm on true
  where
    c.participant_one = user_id_param or c.participant_two = user_id_param
  order by
    lm.created_at desc nulls last, c.created_at desc;
end;
$$;


-- Function to create a conversation and send the first message
-- This securely handles the initial message request.
create or replace function create_conversation_and_send_message(
    p_participant_one uuid,
    p_participant_two uuid,
    p_requester_id uuid,
    p_first_message text
)
returns uuid -- Returns the new conversation's ID
language plpgsql
as $$
declare
  new_conversation_id uuid;
begin
  -- Insert the new conversation
  insert into public.conversations (participant_one, participant_two, requester_id, status)
  values (p_participant_one, p_participant_two, p_requester_id, 'pending')
  returning id into new_conversation_id;

  -- Insert the first message
  if p_first_message is not null and length(p_first_message) > 0 then
    insert into public.messages (conversation_id, sender_id, content)
    values (new_conversation_id, p_requester_id, p_first_message);
  end if;
  
  return new_conversation_id;
end;
$$;


-- Grant usage on the new functions to the authenticated role
grant execute on function is_chat_participant(uuid, uuid) to authenticated;
grant execute on function get_conversations_with_last_message(uuid) to authenticated;
grant execute on function create_conversation_and_send_message(uuid, uuid, uuid, text) to authenticated;

-- RLS Policies for conversations
-- Drop existing policies to avoid conflicts
drop policy if exists "Participants can view their own conversations." on public.conversations;
drop policy if exists "Users can insert their own conversations." on public.conversations;
drop policy if exists "Users can update their own conversation status." on public.conversations;

-- Create new policies
create policy "Participants can view their own conversations."
on public.conversations for select
to authenticated
using (is_chat_participant(id, auth.uid()));

create policy "Users can insert their own conversations."
on public.conversations for insert
to authenticated
with check (
  (participant_one = auth.uid() or participant_two = auth.uid())
  and (status = 'pending')
);

create policy "Users can update their own conversation status."
on public.conversations for update
to authenticated
using (
  -- The user must be a participant
  is_chat_participant(id, auth.uid())
  and
  -- The user must not be the one who made the initial request
  (requester_id != auth.uid())
)
with check (
  -- They can only change the status to 'accepted' or 'blocked'
  status in ('accepted', 'blocked')
);

-- RLS Policies for messages
-- Drop existing policies to avoid conflicts
drop policy if exists "Participants can view messages in their conversations." on public.messages;
drop policy if exists "Participants can insert messages in accepted conversations." on public.messages;

-- Create new policies
create policy "Participants can view messages in their conversations."
on public.messages for select
to authenticated
using (is_chat_participant(conversation_id, auth.uid()));

create policy "Participants can insert messages in conversations."
on public.messages for insert
to authenticated
with check (
  is_chat_participant(conversation_id, auth.uid()) and (
    -- Allow sending if the conversation is accepted
    (select status from conversations where id = conversation_id) = 'accepted'
    or
    -- Allow sending the very first message if conversation is pending AND sender is the requester
    (
      (select status from conversations where id = conversation_id) = 'pending'
      and
      (select count(*) from messages where messages.conversation_id = conversation_id) = 0
      and
      (select requester_id from conversations where id = conversation_id) = auth.uid()
    )
  )
);
