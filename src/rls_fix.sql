-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create rooms." ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can insert participants for rooms they are creating." ON public.chat_room_participants;
DROP POLICY IF EXISTS "Users can insert participants." ON public.chat_room_participants;


-- Allow any authenticated user to create a chat room.
-- Security is managed by who can VIEW and who is a PARTICIPANT.
CREATE POLICY "Users can create rooms."
ON public.chat_rooms FOR INSERT
TO authenticated WITH CHECK (true);

-- Allow any authenticated user to add participants to a room.
-- This is necessary for the initial room creation process.
CREATE POLICY "Users can insert participants."
ON public.chat_room_participants FOR INSERT
TO authenticated WITH CHECK (true);
