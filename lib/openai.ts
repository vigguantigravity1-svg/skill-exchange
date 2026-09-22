import OpenAI from 'openai'

let _openai: OpenAI | null = null
export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}
export async function analyzePortfolio({
  scrapedContent,
  role,
  skills,
}: {
  scrapedContent: string
  role: string
  skills: string[]
}): Promise<{ score: number; reasoning: string }> {
  const prompt = `You are a professional skill verification AI for a skill exchange platform.

A user claims to be a "${role}" with skills in: ${skills.join(', ')}.

Below is scraped content from their portfolio URL. Analyze it carefully and determine how strongly it validates their claimed skills and role.

Portfolio Content:
---
${scrapedContent.slice(0, 6000)}
---

Return ONLY valid JSON with no markdown or code fences, in exactly this format:
{"score": <integer 0-100>, "reasoning": "<one sentence explanation>"}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  })

  const raw = response.choices[0].message.content?.trim() ?? '{}'

  try {
    const parsed = JSON.parse(raw)
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided.',
    }
  } catch {
    return { score: 0, reasoning: 'Failed to parse AI response.' }
  }
}
