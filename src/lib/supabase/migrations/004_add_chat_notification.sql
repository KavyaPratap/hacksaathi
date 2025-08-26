
-- Function to securely create a notification for a new chat message
create or replace function public.create_chat_notification(
    p_recipient_id uuid,
    p_sender_id uuid,
    p_conversation_id uuid,
    p_message_content text
)
returns void
language plpgsql
security definer -- This is crucial for bypassing RLS to insert a notification for another user
set search_path = public
as $$
declare
    sender_name text;
begin
    -- Get the sender's name from the users table
    select full_name into sender_name from public.users where id = p_sender_id;

    -- Insert the notification for the recipient
    insert into public.notifications (user_id, type, data, is_read)
    values (
        p_recipient_id,
        'new_message',
        jsonb_build_object(
            'sender_id', p_sender_id,
            'sender_name', sender_name,
            'conversation_id', p_conversation_id,
            'message_content', p_message_content
        ),
        false
    );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.create_chat_notification(uuid, uuid, uuid, text) to authenticated;
