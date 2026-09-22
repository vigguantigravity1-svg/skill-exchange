import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { analyzePortfolio } from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const { userId, portfolioUrl, linkedinUrl, role, skillsOffered } = await request.json()

    if (!userId || !portfolioUrl || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Step A: Scrape portfolio via Jina Reader ───────────────────
    let scrapedContent = ''
    try {
      const jinaUrl = `https://r.jina.ai/${encodeURIComponent(portfolioUrl)}`
      const jinaRes = await fetch(jinaUrl, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(15000),
      })
      if (jinaRes.ok) {
        scrapedContent = await jinaRes.text()
      }
    } catch (err) {
      console.error('Jina scrape failed:', err)
      // Continue with empty content — AI will give low score
    }

    // Also try to scrape LinkedIn (optional, best-effort)
    if (linkedinUrl) {
      try {
        const linkedinRes = await fetch(`https://r.jina.ai/${encodeURIComponent(linkedinUrl)}`, {
          headers: { Accept: 'text/plain' },
          signal: AbortSignal.timeout(10000),
        })
        if (linkedinRes.ok) {
          const linkedinText = await linkedinRes.text()
          scrapedContent = scrapedContent + '\n\n--- LinkedIn ---\n' + linkedinText
        }
      } catch {
        // ignore
      }
    }

    // ── Step B: Analyze with OpenAI ───────────────────────────────
    const { score, reasoning } = await analyzePortfolio({
      scrapedContent,
      role,
      skills: skillsOffered,
    })

    // ── Step C & D: Gate and persist ─────────────────────────────
    let status: 'approved' | 'pending_community_review' | 'rejected'
    if (score > 80) {
      status = 'approved'
    } else if (score >= 50) {
      status = 'pending_community_review'
    } else {
      status = 'rejected'
    }

    const supabase = await createServerClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trust_score: score,
        status,
        // Store reasoning in a dedicated column if you add one, or just log it
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log(`[Trust Engine] User ${userId}: score=${score}, status=${status}, reasoning=${reasoning}`)

    return NextResponse.json({ status, trust_score: score, reasoning })
  } catch (err) {
    console.error('[Trust Engine] Error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
