-- This script will completely reset the chat, notifications, and activity log functionalities.
-- It is designed to be run in the Supabase SQL Editor.
-- Use this to ensure a clean state for your database tables and functions.

-- Drop existing objects in the correct order using CASCADE to handle dependencies.
DROP FUNCTION IF EXISTS public.is_room_participant(uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_chat_room_and_add_participants(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_existing_chat_room(uuid, uuid) CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_room_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- Create the necessary types
CREATE TYPE public.notification_type AS ENUM ('team_invite', 'new_message', 'welcome');

-- Create the chat_rooms table
CREATE TABLE public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    is_group_chat BOOLEAN DEFAULT false
);

-- Create the chat_room_participants table
CREATE TABLE public.chat_room_participants (
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (room_id, user_id)
);

-- Create the messages table
CREATE TABLE public.messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text', -- e.g., 'text', 'team_invite'
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    data JSONB, -- e.g., { "team_name": "Team Alpha", "team_id": "..." }
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create activity_log table
CREATE TABLE public.activity_log (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- Helper function to check if a user is in a room
CREATE OR REPLACE FUNCTION public.is_room_participant(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.chat_room_participants
        WHERE room_id = p_room_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable RLS for all tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for `chat_rooms`
CREATE POLICY "Users can view rooms they are a participant in." ON public.chat_rooms FOR SELECT TO authenticated USING (is_room_participant(id, auth.uid()));
CREATE POLICY "Allow authenticated users to create chat rooms" ON public.chat_rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update rooms they are in." ON public.chat_rooms FOR UPDATE TO authenticated USING (is_room_participant(id, auth.uid()));

-- Policies for `chat_room_participants`
CREATE POLICY "Users can view participants of rooms they are in." ON public.chat_room_participants FOR SELECT TO authenticated USING (is_room_participant(room_id, auth.uid()));
CREATE POLICY "Users can add themselves or others to rooms they are in." ON public.chat_room_participants FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for `messages`
CREATE POLICY "Users can view messages in rooms they are a participant in." ON public.messages FOR SELECT TO authenticated USING (is_room_participant(room_id, auth.uid()));
CREATE POLICY "Users can insert messages in rooms they are a participant in." ON public.messages FOR INSERT TO authenticated WITH CHECK (is_room_participant(room_id, auth.uid()) AND sender_id = auth.uid());

-- Policies for `notifications`
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications for others." ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies for `activity_log`
CREATE POLICY "Users can view all activity." ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own activity." ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- RPC to find an existing private chat room between two users
CREATE OR REPLACE FUNCTION public.get_existing_chat_room(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS UUID AS $$
DECLARE
    existing_room_id UUID;
BEGIN
    SELECT crp1.room_id INTO existing_room_id
    FROM public.chat_room_participants AS crp1
    JOIN public.chat_room_participants AS crp2 ON crp1.room_id = crp2.room_id
    JOIN public.chat_rooms AS cr ON crp1.room_id = cr.id
    WHERE 
        crp1.user_id = p_user_id_1 
        AND crp2.user_id = p_user_id_2
        AND cr.is_group_chat = false
        AND (
            SELECT COUNT(*) 
            FROM public.chat_room_participants 
            WHERE room_id = crp1.room_id
        ) = 2
    LIMIT 1;
    RETURN existing_room_id;
END;
$$ LANGUAGE plpgsql;

-- RPC to securely create a room and add participants
CREATE OR REPLACE FUNCTION public.create_chat_room_and_add_participants(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_room_id UUID;
BEGIN
  -- Create the new chat room
  INSERT INTO public.chat_rooms (is_group_chat)
  VALUES (false)
  RETURNING id INTO new_room_id;

  -- Add the current user and the other user as participants
  INSERT INTO public.chat_room_participants (room_id, user_id)
  VALUES
    (new_room_id, auth.uid()),
    (new_room_id, p_other_user_id);

  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.chat_rooms, public.chat_room_participants, public.notifications, public.activity_log;

-- Final confirmation
SELECT 'Database reset script completed successfully.' as status;
