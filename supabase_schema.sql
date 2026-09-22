-- ============================================================
-- Skill Exchange — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL,
  location      TEXT,
  phone         TEXT,
  skills_offered TEXT[] DEFAULT '{}',
  skills_needed  TEXT[] DEFAULT '{}',
  linkedin_url  TEXT,
  portfolio_url TEXT,
  trust_score   INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  status        TEXT DEFAULT 'pending_verification'
                  CHECK (status IN ('pending_verification', 'approved', 'pending_community_review', 'rejected')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile row on signup (optional, handled in app)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved profiles"
  ON public.profiles FOR SELECT
  USING (status = 'approved' OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can update trust_score and status (from API route)
CREATE POLICY "Service role can update all profiles"
  ON public.profiles FOR UPDATE
  USING (TRUE);

-- ============================================================
-- CHATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  request_status   TEXT DEFAULT 'pending'
                     CHECK (request_status IN ('pending', 'accepted', 'declined')),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view their chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Chat participants can update their chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id         UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update read_at"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable Realtime for messages and chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;

-- ============================================================
-- BLOCKED USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_id      UUID REFERENCES public.chats(id),
  reason       TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- DONE! Next steps:
-- 1. Go to Supabase Dashboard > Authentication > Providers
--    - Enable Email + Google OAuth
--    - Enable Phone (requires Twilio or similar)
-- 2. Copy your Project URL and anon key into .env.local
-- 3. For Google OAuth, add your callback URL:
--    https://your-project.supabase.co/auth/v1/callback
-- ============================================================
