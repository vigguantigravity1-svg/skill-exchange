import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import SkillCard from '@/components/SkillCard'
import BottomNav from '@/components/BottomNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skill Feed — Skill Exchange',
  description: 'Browse verified professionals ready to exchange skills with you.',
}

export default async function FeedPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Auth guard: check profile status
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!myProfile) redirect('/onboarding')
  if (myProfile.status === 'pending_verification' || myProfile.status === 'pending_community_review') redirect('/pending')
  if (myProfile.status === 'rejected') redirect('/rejected')

  // Fetch all approved profiles except self and blocked users
  const { data: blockedByMe } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  const excludedIds = [
    user.id,
    ...(blockedByMe?.map(b => b.blocked_id) ?? []),
    ...(blockedMe?.map(b => b.blocker_id) ?? []),
  ]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .not('id', 'in', `(${excludedIds.join(',')})`)
    .order('trust_score', { ascending: false })

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="feed-header">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            <span className="gradient-text">Skill</span>Exchange
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {profiles?.length ?? 0} verified professionals
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 8px var(--success)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Live</span>
        </div>
      </div>

      {/* Feed grid */}
      {!profiles || profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No profiles yet</h3>
          <p>Be the first to complete verification and appear here!</p>
        </div>
      ) : (
        <div className="feed-grid">
          {profiles.map(profile => (
            <SkillCard key={profile.id} profile={profile} currentUserId={user.id} />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
