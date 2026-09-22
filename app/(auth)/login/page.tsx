import type { Metadata } from 'next'
import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In — Skill Exchange',
  description: 'Sign in to your Skill Exchange account and start trading skills with verified professionals.',
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <h1>
            <span className="gradient-text">Skill</span>Exchange
          </h1>
          <p>Trade skills. Build together. No money needed.</p>
        </div>

        <AuthForm mode="login" />

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/signup">Create one for free</Link>
        </div>
      </div>
    </div>
  )
}
