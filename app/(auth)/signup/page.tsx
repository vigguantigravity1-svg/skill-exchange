import type { Metadata } from 'next'
import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Create Account — Skill Exchange',
  description: 'Join Skill Exchange and connect with verified professionals to trade skills.',
}

export default function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <h1>
            <span className="gradient-text">Join</span> the Exchange
          </h1>
          <p>Create your free account and start trading skills.</p>
        </div>

        <AuthForm mode="signup" />

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
