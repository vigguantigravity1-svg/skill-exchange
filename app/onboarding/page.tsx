import type { Metadata } from 'next'
import OnboardingForm from '@/components/OnboardingForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Complete Your Profile — Skill Exchange',
  description: 'Complete your profile to join the Skill Exchange community.',
}

export default function OnboardingPage() {
  return (
    <div className="onboarding-page">
      <OnboardingForm />
    </div>
  )
}
