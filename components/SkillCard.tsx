'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import TrustBadge from './TrustBadge'
import type { Profile } from '@/lib/supabase'

interface SkillCardProps {
  profile: Profile
  currentUserId: string
}

export default function SkillCard({ profile, currentUserId }: SkillCardProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)

  const supabase = createBrowserClient()

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Generate a deterministic gradient color from name
  const hue = profile.full_name.charCodeAt(0) * 15 % 360
  const avatarStyle = {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 60) % 360}, 70%, 50%))`,
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/chat/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiatorId: currentUserId, recipientId: profile.id }),
      })
      const data = await res.json()
      if (data.chatId) {
        router.push(`/chat/${data.chatId}`)
      }
    } catch (err) {
      console.error('Connect error:', err)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="skill-card glass-card" style={{ animationDelay: `${Math.random() * 0.3}s` }}>
      {/* Header */}
      <div className="skill-card-header">
        <div className="avatar avatar-lg" style={avatarStyle}>{initials}</div>
        <div className="skill-card-info">
          <div className="skill-card-name">{profile.full_name}</div>
          <div className="skill-card-role">{profile.role}</div>
          <div className="skill-card-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {profile.location}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="skill-section">
        <div className="skill-label">Offers</div>
        <div className="skill-chips">
          {profile.skills_offered.slice(0, 4).map(skill => (
            <span key={skill} className="skill-chip skill-chip-offer">{skill}</span>
          ))}
          {profile.skills_offered.length > 4 && (
            <span className="skill-chip skill-chip-offer">+{profile.skills_offered.length - 4}</span>
          )}
        </div>
      </div>

      <div className="skill-section">
        <div className="skill-label">Needs</div>
        <div className="skill-chips">
          {profile.skills_needed.slice(0, 4).map(skill => (
            <span key={skill} className="skill-chip skill-chip-need">{skill}</span>
          ))}
          {profile.skills_needed.length > 4 && (
            <span className="skill-chip skill-chip-need">+{profile.skills_needed.length - 4}</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="skill-card-footer">
        <TrustBadge score={profile.trust_score} />
        <button
          className={`btn btn-primary btn-sm ${connecting ? 'btn-loading' : ''}`}
          onClick={handleConnect}
          disabled={connecting}
          id={`connect-${profile.id}`}
        >
          {!connecting && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
              Connect
            </>
          )}
        </button>
      </div>
    </div>
  )
}
