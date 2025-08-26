-- Create a function to safely create a chat notification
CREATE OR REPLACE FUNCTION public.create_chat_notification(
    p_recipient_id uuid,
    p_sender_id uuid,
    p_conversation_id uuid,
    p_message_content text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sender_name_text text;
BEGIN
    -- Get sender's full name
    SELECT full_name INTO sender_name_text FROM public.users WHERE id = p_sender_id;

    -- Insert notification for the recipient
    INSERT INTO public.notifications (user_id, type, data)
    VALUES (
        p_recipient_id,
        'new_message',
        jsonb_build_object(
            'sender_id', p_sender_id,
            'sender_name', sender_name_text,
            'conversation_id', p_conversation_id,
            'message_content', p_message_content
        )
    );
END;
$$;
