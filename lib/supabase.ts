import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type Profile = {
  id: string
  full_name: string
  role: string
  location: string
  phone: string
  skills_offered: string[]
  skills_needed: string[]
  linkedin_url: string
  portfolio_url: string
  trust_score: number
  status: 'pending_verification' | 'approved' | 'pending_community_review' | 'rejected'
  avatar_url?: string
  created_at: string
}

export type Chat = {
  id: string
  user1_id: string
  user2_id: string
  last_message: string | null
  last_message_at: string | null
  request_status: 'pending' | 'accepted' | 'declined'
  updated_at: string
}

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
}

// Browser client (for Client Components)
export const createBrowserClient = () =>
  createClientComponentClient<{ profiles: Profile; chats: Chat; messages: Message }>()

// Server client (for Server Components / Route Handlers)
export const createServerClient = () =>
  createServerComponentClient<{ profiles: Profile; chats: Chat; messages: Message }>({
    cookies,
  })

// Admin / service role client (for API routes that need elevated access)
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
