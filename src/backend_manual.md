# HackMatch Backend Developer Manual

## 1. Introduction

This document outlines the backend architecture for the HackMatch application. Unlike a traditional monolithic backend, HackMatch uses a **Backend-as-a-Service (BaaS)** model provided by [Supabase](https://supabase.io/). This allows the frontend to communicate directly and securely with the database, authentication, and storage services.

### 1.1. Tech Stack

- **Platform**: [Supabase](https://supabase.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **Authentication**: [Supabase Auth](https://supabase.io/docs/guides/auth) (configured for email/password with OTP verification).
- **Storage**: [Supabase Storage](https://supabase.io/docs/guides/storage) for user avatars.
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) with the Gemini API, running as serverless functions within the Next.js application.
- **Hosting**: [Vercel](https://vercel.com/)

---

## 2. Data Models (PostgreSQL)

The data is organized into relational tables. **Row Level Security (RLS)** is heavily used to secure data access, ensuring users can only view or modify data they are permitted to.

### 2.1. `users` Table

This table stores the public profiles of all users, linked to their authentication identity via a foreign key relationship to the `auth.users` table.

- **Primary Key**: `id` (UUID, linked to `auth.users`)
- **SQL to Create Table**:
  ```sql
  -- Create the users table
  CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT, -- URL to the image in Supabase Storage
    bio TEXT,
    location TEXT,
    gender TEXT, -- e.g., 'male', 'female', 'other', 'prefer_not_to_say'
    experience TEXT, -- e.g., 'beginner', 'intermediate', 'advanced'
    looking_for TEXT, -- A description of what the user is looking for
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    tech_stack TEXT[],
    interests TEXT[],
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    theme TEXT DEFAULT 'system',
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Enable Row Level Security
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

  -- Policy: All authenticated users can view all profiles.
  CREATE POLICY "Public profiles are viewable by authenticated users."
  ON public.users FOR SELECT
  TO authenticated USING ( true );

  -- Policy: Users can insert their own profile.
  CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  TO authenticated WITH CHECK ( auth.uid() = id );

  -- Policy: Users can update their own profile.
  CREATE POLICY "Users can update their own profile."
  ON public.users FOR UPDATE
  TO authenticated USING ( auth.uid() = id );
  ```
  **Note:** The user's `email` is sourced directly from the `auth.users` table and does not need to be duplicated here.

### 2.2. `teams`, `team_members` Tables

These tables manage team creation and membership.

- **SQL to Create Tables**:
  ```sql
  -- Create the teams table
  CREATE TABLE public.teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      project_name TEXT,
      description TEXT,
      banner_url TEXT,
      owner_id UUID NOT NULL REFERENCES public.users(id),
      created_at TIMESTAMPTZ DEFAULT now()
  );
  
  -- Create the team_members junction table
  CREATE TABLE public.team_members (
      team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member', -- e.g., 'owner', 'member'
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (team_id, user_id)
  );

  -- Enable RLS for all new tables
  ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

  -- Policies for `teams`
  CREATE POLICY "Teams are viewable by all authenticated users." ON public.teams FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Team owners can create teams." ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
  CREATE POLICY "Team owners can update their own teams." ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
  CREATE POLICY "Team owners can delete their own teams." ON public.teams FOR DELETE TO authenticated USING (auth.uid() = owner_id);

  -- Policies for `team_members`
  CREATE POLICY "Team members can view the member list." ON public.team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM team_members WHERE team_id = team_members.team_id AND user_id = auth.uid()));
  CREATE POLICY "Team owners can add members." ON public.team_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid()));
  CREATE POLICY "Members can leave a team." ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Team owners can remove members." ON public.team_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid()));
  ```
---

### 2.3. Simplified Chat & Notifications

Run the SQL in `src/lib/supabase/migrations/001_simplify_chat.sql` in the Supabase SQL Editor to set up the simplified chat system. The manual for this section has been updated to reflect the new, corrected policies.

**Key Components of the Chat System:**

-   **`conversations` table**: Stores metadata about a chat, including the two participants and a `status` (`pending`, `accepted`, `blocked`).
-   **`messages` table**: Stores the actual message content.
-   **`is_chat_participant()` function**: A security-critical helper function in the database that safely checks if a user is part of a conversation. This is used in the RLS policies to prevent infinite recursion.
-   **`get_conversations_with_last_message()` function**: An RPC function that fetches all of a user's conversations along with the most recent message for each, simplifying the logic required on the client side.

**Core RLS Policies & Grants for Chat:**
-   **Permissions**: The `authenticated` role is granted `USAGE` on the `public` schema and `SELECT` on the `conversations`, `messages`, and `users` tables. This is crucial for allowing the RPC function to execute successfully.
-   **Read Access**: Users can only `SELECT` conversations and messages they are a participant in.
-   **Write Access (`messages`)**: A user can only `INSERT` a message if:
    1.  They are a participant in the conversation.
    2.  The conversation `status` is `accepted`.
    3.  OR, it is the very first message being sent in a `pending` conversation (the message request).

This setup ensures that the chat is secure and that the "message request" flow works as intended.

---

## 3. Storage

### 3.1. `avatars` Bucket

- **Purpose**: Stores user profile pictures.
- **Access Policies**: The bucket is configured to be public for reads, but writes (uploads, updates, deletes) are restricted by policies to ensure users can only modify their own avatar.
- **SQL for Storage Policies**:
  ```sql
  -- Policies for 'avatars' bucket
  -- This policy makes all objects in the 'avatars' bucket publicly accessible.
  CREATE POLICY "Avatar images are publicly viewable." ON storage.objects 
  FOR SELECT USING ( bucket_id = 'avatars' );

  -- This policy allows an authenticated user to upload an avatar.
  -- The folder name in the path must match the user's UID.
  -- Example path: `user-id-123/avatar.png`
  CREATE POLICY "Users can upload their own avatar." ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

  -- This policy allows a user to update their own avatar.
  CREATE POLICY "Users can update their own avatar." ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
  ```

---

## 4. AI & Server-Side Logic (Genkit)

All AI logic is handled by **Genkit flows**, which are essentially serverless functions co-located within the Next.js application. They are defined in the `src/ai/flows/` directory and are marked with the `'use server';` directive.

- **How it Works:**
  1. A client component (e.g., `Profile.tsx` for PeerJet) calls an exported async function (e.g., `findPeers`).
  2. This function, running on the server, executes a Genkit flow.
  3. The flow uses an `ai.definePrompt(...)` to interact with the Gemini model, passing it a structured prompt and data.
  4. The Gemini model processes the input and returns a structured JSON object or a string.
  5. The Genkit flow returns this output to the client component.

- **Key Flows:**
  - **`peerjet-flow.ts`**: Powers the AI teammate search. It takes a user query and a list of candidates, and returns a sorted list of users who are the best match.
  - **`profile-flow.ts`**: Assists in profile creation by generating a user bio based on their skills and interests.

## 5. Deployment

- The Next.js application is deployed to **Vercel**.
- The Supabase project (database, auth, storage) is managed through the Supabase Dashboard.
- Environment variables, including Supabase URL/keys and the Gemini API key, are stored securely in Vercel's project settings. They should **never** be committed to the Git repository.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`
