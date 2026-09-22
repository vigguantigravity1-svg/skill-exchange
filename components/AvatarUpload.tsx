'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  onUploadSuccess: (url: string) => void
  fullName?: string
}

export default function AvatarUpload({ userId, avatarUrl, onUploadSuccess, fullName = '' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('File must be less than 2MB')
      return
    }

    setUploading(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}-${Math.random()}.${fileExt}`

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // 3. Update Profile Table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      onUploadSuccess(publicUrl)
    }

    setUploading(false)
  }

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="avatar-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div 
        className="avatar-circle"
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          width: 100, 
          height: 100, 
          borderRadius: '50%',
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--primary-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          cursor: uploading ? 'wait' : 'pointer',
          border: '3px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!avatarUrl && initials}
        
        {/* Overlay on hover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s',
          fontSize: '0.9rem'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          {uploading ? '⏳' : '📷 Edit'}
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {error && <p style={{ color: '#fca5a5', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
    </div>
  )
}
