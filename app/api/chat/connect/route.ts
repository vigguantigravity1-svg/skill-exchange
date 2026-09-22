import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { initiatorId, recipientId } = await request.json()

    if (!initiatorId || !recipientId) {
      return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 })
    }

    if (initiatorId === recipientId) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Check if either user has blocked the other
    const { data: blocks } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${initiatorId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${initiatorId})`)

    if (blocks && blocks.length > 0) {
      return NextResponse.json({ error: 'Cannot connect with this user' }, { status: 403 })
    }

    // Check if chat already exists (in either direction)
    const { data: existingChat } = await supabase
      .from('chats')
      .select('id, request_status')
      .or(
        `and(user1_id.eq.${initiatorId},user2_id.eq.${recipientId}),` +
        `and(user1_id.eq.${recipientId},user2_id.eq.${initiatorId})`
      )
      .not('request_status', 'eq', 'declined')
      .maybeSingle()

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat.id, existing: true })
    }

    // Create new chat with pending request status
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        user1_id: initiatorId,
        user2_id: recipientId,
        request_status: 'pending',
        last_message: null,
        last_message_at: null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chatId: newChat.id, existing: false })
  } catch (err) {
    console.error('[chat/connect]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
