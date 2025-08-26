
-- This function retrieves all conversations for a given user,
-- along with the ID and details of the other participant, and the content
-- and creation time of the most recent message in each conversation.
create or replace function get_conversations_with_last_message(user_id_param uuid)
returns table (
  id uuid,
  participant_one uuid,
  participant_two uuid,
  last_message_content text,
  last_message_created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.participant_one,
    c.participant_two,
    m.content as last_message_content,
    m.created_at as last_message_created_at
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
  ) m on true
  where
    c.participant_one = user_id_param or c.participant_two = user_id_param
  order by
    m.created_at desc nulls last;
$$;
