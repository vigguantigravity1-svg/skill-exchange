import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not Approved — Skill Exchange',
  description: 'Your profile was not approved. Update your portfolio and try again.',
}

export default function RejectedPage() {
  return (
    <div className="status-page">
      <div className="status-icon status-icon-rejected">❌</div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Profile Not Approved</h1>
      <p style={{ maxWidth: 400, marginBottom: 32 }}>
        Our AI Trust Engine couldn&apos;t verify your claimed skills from your portfolio.
        This could be because the portfolio URL was inaccessible or didn&apos;t demonstrate the skills clearly.
      </p>

      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        maxWidth: 400,
        marginBottom: 32,
        textAlign: 'left',
      }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-primary)' }}>
          How to improve your score:
        </h3>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Make your GitHub repositories public with clear README files',
            'Add detailed descriptions to your Behance projects',
            'Update your LinkedIn with specific project outcomes',
            'Make sure portfolio URLs are publicly accessible (no login required)',
          ].map((tip, i) => (
            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</li>
          ))}
        </ul>
      </div>

      <Link href="/onboarding" className="btn btn-primary">
        🔄 Update Portfolio & Resubmit
      </Link>
    </div>
  )
}
