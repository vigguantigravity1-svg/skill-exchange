import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', data.user.id)
        .single()

      if (!profile) return NextResponse.redirect(`${origin}/onboarding`)
      if (profile.status === 'approved') return NextResponse.redirect(`${origin}/feed`)
      if (profile.status === 'rejected') return NextResponse.redirect(`${origin}/rejected`)
      return NextResponse.redirect(`${origin}/pending`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
