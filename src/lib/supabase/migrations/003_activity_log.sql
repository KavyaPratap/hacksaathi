-- Enable RLS for the activity_log table
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert into the activity_log
CREATE POLICY "Allow authenticated users to insert into activity_log"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own activity log entries
CREATE POLICY "Allow users to view their own activity"
ON public.activity_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.log_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    recipient_id uuid;
BEGIN
    -- Determine the recipient ID
    SELECT
        CASE
            WHEN participant_one = NEW.sender_id THEN participant_two
            ELSE participant_one
        END
    INTO recipient_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;

    -- Insert into activity_log for the sender
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
        NEW.sender_id,
        'sent a message to',
        jsonb_build_object('to', (SELECT full_name FROM public.users WHERE id = recipient_id))
    );

    -- Insert into activity_log for the recipient
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
        recipient_id,
        'received a message from',
        jsonb_build_object('from', (SELECT full_name FROM public.users WHERE id = NEW.sender_id))
    );
    
    RETURN NEW;
END;
$$;

-- Create a trigger on the messages table
CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.log_new_message();

    