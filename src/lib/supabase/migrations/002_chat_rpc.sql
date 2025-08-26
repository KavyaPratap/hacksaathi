
-- Function to get all conversations for the current user with the last message for each.
create or replace function get_conversations_with_last_message(user_id_param uuid)
returns table (
    id uuid,
    participant_one uuid,
    participant_two uuid,
    last_message_content text,
    last_message_created_at timestamptz
)
language plpgsql
security definer -- Important: Runs with the permissions of the function owner, but we use `auth.uid()` to keep it secure.
set search_path = public
as $$
begin
    -- Ensure the user_id_param matches the logged-in user to prevent unauthorized access.
    if user_id_param <> auth.uid() then
        raise exception 'User can only fetch their own conversations.';
    end if;

    return query
    with last_messages as (
      select
        m.conversation_id,
        m.content,
        m.created_at,
        row_number() over(partition by m.conversation_id order by m.created_at desc) as rn
      from messages m
      -- Pre-filter messages to only those in conversations the user is part of.
      -- This is a performance optimization.
      where m.conversation_id in (select c.id from conversations c where c.participant_one = user_id_param or c.participant_two = user_id_param)
    )
    select
        c.id,
        c.participant_one,
        c.participant_two,
        lm.content as last_message_content,
        lm.created_at as last_message_created_at
    from
        conversations c
    left join last_messages lm on c.id = lm.conversation_id and lm.rn = 1
    where
        (c.participant_one = user_id_param or c.participant_two = user_id_param)
    order by
        lm.created_at desc nulls last;
end;
$$;
