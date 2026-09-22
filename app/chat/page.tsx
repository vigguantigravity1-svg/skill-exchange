import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import ChatList from '@/components/ChatList'
import BottomNav from '@/components/BottomNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages — Skill Exchange',
  description: 'Your conversations on Skill Exchange.',
}

export default async function ChatPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'approved') redirect('/pending')

  return (
    <div className="page-wrapper">
      <div className="chat-list-header">
        <h2>Messages</h2>
      </div>

      <ChatList userId={user.id} />
      <BottomNav />
    </div>
  )
}
