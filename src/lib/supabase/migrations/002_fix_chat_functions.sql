
-- Drop the existing functions and dependent policies if they exist to avoid conflicts.
-- The CASCADE option will automatically remove dependent objects, like RLS policies.
DROP FUNCTION IF EXISTS public.is_chat_participant(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversations_with_last_message(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_conversation_and_send_message(uuid, uuid, uuid, text) CASCADE;


-- Function to safely check if a user is part of a conversation.
-- This is a helper for RLS policies to prevent infinite recursion.
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Important for RLS
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id AND (participant_one = p_user_id OR participant_two = p_user_id)
  );
$$;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO authenticated;


-- RLS policy for reading conversations
-- This was likely dropped by the CASCADE, so we re-create it.
CREATE POLICY "Users can view conversations they are a part of."
ON public.conversations FOR SELECT
TO authenticated
USING (
  (participant_one = auth.uid() OR participant_two = auth.uid())
);

-- RLS policy for reading messages
-- This was likely dropped by the CASCADE, so we re-create it.
CREATE POLICY "Users can view messages in conversations they are a part of."
ON public.messages FOR SELECT
TO authenticated
USING (
  public.is_chat_participant(conversation_id, auth.uid())
);

-- RLS policy for inserting messages
-- This was likely dropped by the CASCADE, so we re-create it.
CREATE POLICY "Users can insert messages in accepted conversations they are a part of."
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    -- The user must be a participant
    public.is_chat_participant(conversation_id, auth.uid()) AND (
        -- AND The conversation must be 'accepted'
        (SELECT status FROM public.conversations WHERE id = conversation_id) = 'accepted'
        OR
        -- OR it's the very first message from the non-requester
        (
            (SELECT status FROM public.conversations WHERE id = conversation_id) = 'pending' AND
            (SELECT requester_id FROM public.conversations WHERE id = conversation_id) <> auth.uid()
        )
    )
);


-- Function to get all of a user's conversations along with the last message.
-- CORRECTED: Changed 'conversation_status' to 'text' to match the actual table column type.
CREATE OR REPLACE FUNCTION public.get_conversations_with_last_message(p_user_id_param uuid)
RETURNS TABLE(id uuid, participant_one uuid, participant_two uuid, status text, requester_id uuid, last_message_content text, last_message_created_at timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            m.created_at,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM
            public.messages m
        JOIN
            public.conversations c ON m.conversation_id = c.id
        WHERE
            c.participant_one = p_user_id_param OR c.participant_two = p_user_id_param
    )
    SELECT
        c.id,
        c.participant_one,
        c.participant_two,
        c.status,
        c.requester_id,
        lm.content,
        lm.created_at
    FROM
        public.conversations c
    LEFT JOIN
        ranked_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE
        c.participant_one = p_user_id_param OR c.participant_two = p_user_id_param
    ORDER BY
        lm.created_at DESC NULLS LAST, c.created_at DESC;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.get_conversations_with_last_message(uuid) TO authenticated;


-- Secure RPC function to create a conversation and send the first message
CREATE OR REPLACE FUNCTION public.create_conversation_and_send_message(
    p_participant_one uuid,
    p_participant_two uuid,
    p_requester_id uuid,
    p_first_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_conversation_id uuid;
BEGIN
    -- Insert a new conversation and get its ID
    INSERT INTO public.conversations (participant_one, participant_two, requester_id, status)
    VALUES (p_participant_one, p_participant_two, p_requester_id, 'pending')
    RETURNING id INTO new_conversation_id;

    -- If a first message is provided, insert it
    IF p_first_message IS NOT NULL AND p_first_message != '' THEN
        INSERT INTO public.messages (conversation_id, sender_id, content)
        VALUES (new_conversation_id, p_requester_id, p_first_message);
    END IF;
    
    -- Return the new conversation's ID
    RETURN new_conversation_id;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.create_conversation_and_send_message(uuid, uuid, uuid, text) TO authenticated;
