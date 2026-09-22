import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Under Review — Skill Exchange',
  description: 'Your profile is being reviewed by our community.',
}

export default function PendingPage() {
  return (
    <div className="status-page">
      <div className="status-icon status-icon-pending">⏳</div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Profile Under Review</h1>
      <p style={{ maxWidth: 380, marginBottom: 32 }}>
        Your AI Trust Score puts you in our community review queue.
        Our team will verify your profile within <strong style={{ color: 'var(--text-primary)' }}>24–48 hours</strong>.
        You&apos;ll be notified once approved.
      </p>

      <div style={{
        padding: '16px 24px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 'var(--radius-md)',
        maxWidth: 360,
        marginBottom: 32,
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--warning)', margin: 0 }}>
          💡 While you wait, make sure your portfolio and LinkedIn are up to date — reviewers will check them.
        </p>
      </div>

      <Link href="/login" className="btn btn-secondary">
        ← Back to Login
      </Link>
    </div>
  )
}
