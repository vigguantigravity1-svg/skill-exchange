'use client'

import { useEffect, useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import AvatarUpload from '@/components/AvatarUpload'
import BottomNav from '@/components/BottomNav'

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'UI/UX Designer', 'Graphic Designer', 'Product Manager',
  'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
  'Mobile Developer', 'Content Writer', 'Digital Marketer',
  'Video Editor', 'Photographer', 'Business Analyst', 'Other',
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [status, setStatus] = useState('')
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  
  const [skillsOffered, setSkillsOffered] = useState<string[]>([])
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])
  const [offerInput, setOfferInput] = useState('')
  const [needInput, setNeedInput] = useState('')
  
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        setAvatarUrl(profile.avatar_url)
        setFullName(profile.full_name)
        setRole(profile.role)
        setLocation(profile.location || '')
        setSkillsOffered(profile.skills_offered || [])
        setSkillsNeeded(profile.skills_needed || [])
        setLinkedinUrl(profile.linkedin_url || '')
        setPortfolioUrl(profile.portfolio_url || '')
        setStatus(profile.status || '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  // ── Chip input helpers ─────────────────────────────────────────
  function addChip(value: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) {
    const trimmed = value.trim()
    if (trimmed && !list.includes(trimmed) && list.length < 10) {
      setter([...list, trimmed])
    }
    inputSetter('')
  }

  function removeChip(index: number, list: string[], setter: (v: string[]) => void) {
    setter(list.filter((_, i) => i !== index))
  }

  function handleChipKeyDown(e: KeyboardEvent<HTMLInputElement>, value: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addChip(value, list, setter, inputSetter)
    } else if (e.key === 'Backspace' && value === '' && list.length > 0) {
      setter(list.slice(0, -1))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    
    if (!fullName.trim() || !role || !location.trim()) {
      setError('Please fill out all required personal info.')
      return
    }
    
    if (skillsOffered.length === 0 || skillsNeeded.length === 0) {
      setError('Please add at least one skill offered and needed.')
      return
    }
    
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      role,
      location,
      skills_offered: skillsOffered,
      skills_needed: skillsNeeded,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl
    }).eq('id', userId)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 20px 80px' }}>
      <div className="glass-card" style={{ padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Edit Profile
        </h1>

        <div style={{ marginBottom: '30px' }}>
          <AvatarUpload 
            userId={userId} 
            avatarUrl={avatarUrl} 
            onUploadSuccess={(url) => setAvatarUrl(url)}
            fullName={fullName}
          />
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: 20 }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#86efac', fontSize: '0.85rem', marginBottom: 20 }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)} required>
              <option value="">Select your role...</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Skills I Can Offer</label>
            <div className="chip-container" onClick={() => document.getElementById('offer-input')?.focus()}>
              {skillsOffered.map((s, i) => (
                <span key={i} className="chip">
                  {s} <span className="chip-remove" onClick={() => removeChip(i, skillsOffered, setSkillsOffered)}>×</span>
                </span>
              ))}
              <input
                id="offer-input"
                className="chip-input"
                placeholder={skillsOffered.length === 0 ? 'Add skills...' : 'Add more...'}
                value={offerInput}
                onChange={e => setOfferInput(e.target.value)}
                onKeyDown={e => handleChipKeyDown(e, offerInput, skillsOffered, setSkillsOffered, setOfferInput)}
                onBlur={() => offerInput && addChip(offerInput, skillsOffered, setSkillsOffered, setOfferInput)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills I Need</label>
            <div className="chip-container" onClick={() => document.getElementById('need-input')?.focus()}>
              {skillsNeeded.map((s, i) => (
                <span key={i} className="chip" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.35)', color: '#67e8f9' }}>
                  {s} <span className="chip-remove" onClick={() => removeChip(i, skillsNeeded, setSkillsNeeded)}>×</span>
                </span>
              ))}
              <input
                id="need-input"
                className="chip-input"
                placeholder={skillsNeeded.length === 0 ? 'Add skills...' : 'Add more...'}
                value={needInput}
                onChange={e => setNeedInput(e.target.value)}
                onKeyDown={e => handleChipKeyDown(e, needInput, skillsNeeded, setSkillsNeeded, setNeedInput)}
                onBlur={() => needInput && addChip(needInput, skillsNeeded, setSkillsNeeded, setNeedInput)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              LinkedIn URL
              {status === 'approved' && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--success)' }}>🔒 Locked for Trust Verification</span>}
            </label>
            <input 
              className="form-input" 
              type="url" 
              value={linkedinUrl} 
              onChange={e => setLinkedinUrl(e.target.value)} 
              disabled={status === 'approved'}
              style={{ opacity: status === 'approved' ? 0.6 : 1, cursor: status === 'approved' ? 'not-allowed' : 'text' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Portfolio URL
              {status === 'approved' && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--success)' }}>🔒 Locked for Trust Verification</span>}
            </label>
            <input 
              className="form-input" 
              type="url" 
              value={portfolioUrl} 
              onChange={e => setPortfolioUrl(e.target.value)} 
              disabled={status === 'approved'}
              style={{ opacity: status === 'approved' ? 0.6 : 1, cursor: status === 'approved' ? 'not-allowed' : 'text' }}
            />
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary btn-full ${saving ? 'btn-loading' : ''}`}
            disabled={saving}
            style={{ marginTop: '10px' }}
          >
            {!saving && 'Save Changes'}
          </button>
        </form>

        <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'transparent', 
              border: '1px solid rgba(239,68,68,0.3)', 
              color: '#fca5a5', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Log Out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
