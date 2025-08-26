# HackMatch Frontend Developer Manual

## 1. Introduction

Welcome to the HackMatch frontend manual! This document provides a comprehensive guide to the project's architecture, components, and development practices. The goal is to ensure consistency, maintainability, and a smooth onboarding process for new developers.

### 1.1. Philosophy

The frontend is built with a focus on a highly dynamic, engaging, and visually rich user experience. We prioritize a clean, component-based architecture that leverages the strengths of the Next.js App Router for performance and clear organization. The application is fully integrated with a Supabase backend for database operations and authentication.

### 1.2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes) for light/dark mode management.
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) for server state management and caching.
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) for AI-powered features.
- **Backend Communication**: [Supabase Client](https://supabase.io/docs/library/js/getting-started) for interacting with the database and authentication.

---

## 2. Project Structure

The project uses the Next.js App Router paradigm. This structure organizes the application by URL segments, making it intuitive to find and manage code for specific routes.

```
/src
├── app/                  # Main application routes
│   ├── (main)/           # Route group for main authenticated pages
│   │   ├── dashboard/    # Dashboard page
│   │   ├── discover/     # Page for finding teammates
│   │   ├── chat/         # Chat/messaging interface
│   │   ├── profile/      # User profile pages
│   │   │   ├── [id]/     # Dynamic route for other users' profiles
│   │   │   └── page.tsx  # Current user's editable profile
│   │   ├── teams/        # Team management page
│   │   └── settings/     # User settings page
│   │   └── layout.tsx    # Shared layout for main pages (Header/Footer)
│   ├── login/            # Login/Signup page
│   ├── auth/             # Routes for authentication callbacks and password reset
│   ├── page.tsx          # Root page (Landing Page)
│   └── layout.tsx        # Root layout for the entire application
│
├── components/           # Reusable components
│   ├── ui/               # Core UI components from shadcn/ui
│   ├── *.tsx             # Custom application-specific components
│
├── ai/                   # Genkit AI files
│   ├── flows/            # Genkit flow definitions (e.g., peerjet-flow.ts)
│   ├── schemas/          # Zod schemas for AI flow inputs/outputs
│   └── init.ts           # Genkit initialization
│
├── lib/                  # Utility functions and data
│   ├── supabase/         # Supabase client/server initializers
│   └── utils.ts          # General utility functions
│
└── frontend_manual.md    # This file
```

---

## 3. Core Concepts & Architecture

### 3.1. Routing

We use the **Next.js App Router**. Each folder inside `/app` corresponds to a URL segment.
- `page.tsx` defines the unique UI for that segment.
- `layout.tsx` defines a shared UI for a segment and its children.
- We use a route group `(main)` to apply a shared layout (with a Header) to all authenticated parts of the application without affecting the URL path.
- Dynamic routes like `/profile/[id]` are used to generate pages for specific users.

### 3.2. Styling & Theme

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **shadcn/ui**: Provides beautifully designed, accessible, and unstyled components that we can customize.
- **Theming**: Managed via `next-themes` and CSS variables in `src/app/globals.css`.
  - The dark mode features a distinct red-and-black "space" theme with animated grids and particles.
  - The `ThemeProvider` in `src/components/theme-provider.tsx` wraps the app to manage state.

### 3.3. State Management & Data Fetching

- **Client State**: For UI interactivity (e.g., form inputs, active tabs), we use local component state with React hooks (`useState`, `useEffect`). These components are marked with `'use client';`.
- **Server State & Data**: Data fetching from the Supabase backend is handled on the client side within components. We use `useEffect` hooks to fetch data when a component mounts. For a more robust solution in the future, we can integrate TanStack Query to handle caching, refetching, and server state synchronization.

---

## 4. Key Components & Features

### 4.1. Authentication Flow

- **Login/Sign-up (`login/page.tsx` & `LoginForm`):** A single form handles both user sign-in and sign-up. New sign-ups are restricted to `@niet.co.in` emails.
- **OTP Verification (`auth/verify-otp`):** After signing up, users are sent an OTP and redirected to this page for verification.
- **Profile Creation (`profile/create`):** Upon first successful login, users are redirected to an interactive, chat-based onboarding flow to create their profile.
- **Session Management:** The Supabase client libraries (`@supabase/ssr`) handle session management using cookies, integrating seamlessly with Next.js Server and Client Components.

### 4.2. Core UI Components

- **`MinimalHero.tsx` (`/`):** The landing page for unauthenticated users, featuring a dynamic, animated background with a 3D grid and particle effects.
- **`NewDashboard.tsx` (`/dashboard`):** The central hub for authenticated users. It mirrors the aesthetic of the landing page and provides quick actions and summaries.
- **`Discover.tsx` (`/discover`):** Page for finding teammates, with filtering capabilities. User data is fetched directly from the Supabase `users` table.
- **`Profile.tsx` (`/profile/finder`):** The AI-powered "PeerJet" teammate finder. Users can type a natural language query, which is sent to a Genkit flow. The AI sorts users from the database based on relevance and displays them in a ranked list.
- **`UserProfile.tsx` (`/profile/[id]` & `/profile`):** A versatile page that handles viewing other users' profiles (read-only) and the current user's own editable profile.

### 4.3. AI Integration (Genkit)

- **PeerJet Teammate Finder (`peerjet-flow.ts`):** This is the core AI feature.
  - The frontend sends a user's query and a list of potential users to the Genkit flow.
  - The flow uses a "triage" prompt to determine if the query is a search request or a conversational question (e.g., "who made you?").
  - If it's a search, a second prompt ranks the provided users based on the query.
  - The flow returns either a conversational answer or a sorted list of user IDs with a match score and a reason.
- **AI Bio Generation (`profile-flow.ts`):** During the profile creation process, this flow uses the user's provided skills and interests to generate a compelling bio.
- **Server/Client Separation:** To prevent server-side code from leaking into the client bundle, Genkit schemas (defined with Zod) are kept in separate files (`src/ai/schemas/`) from the flow logic (`src/ai/flows/`). Client components import types from the schema files only.