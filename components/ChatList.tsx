'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

type ChatRow = {
  id: string
  other_user: {
    id: string
    full_name: string
    role: string
  }
  last_message: string | null
  last_message_at: string | null
  request_status: 'pending' | 'accepted' | 'declined'
  unread_count: number
  is_request_to_me: boolean
}

export default function ChatList({ userId }: { userId: string }) {
  const [chats, setChats] = useState<ChatRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadChats()

    // Real-time updates for new messages / chat changes
    const channel = supabase
      .channel('chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, loadChats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadChats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadChats() {
    // Fetch all chats involving the user (not declined)
    const { data: rawChats } = await supabase
      .from('chats')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message,
        last_message_at,
        request_status
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .neq('request_status', 'declined')
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!rawChats) { setLoading(false); return }

    // Fetch profiles for the other users in parallel
    const otherUserIds = rawChats.map(c => c.user1_id === userId ? c.user2_id : c.user1_id)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('id', otherUserIds)

    const profileMap: Record<string, { id: string; full_name: string; role: string }> = {}
    profilesData?.forEach(p => { profileMap[p.id] = p })

    // Count unread messages per chat
    const chatRows: ChatRow[] = await Promise.all(
      rawChats.map(async (chat) => {
        const otherId = chat.user1_id === userId ? chat.user2_id : chat.user1_id
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('receiver_id', userId)
          .is('read_at', null)

        return {
          id: chat.id,
          other_user: profileMap[otherId] ?? { id: otherId, full_name: 'Unknown', role: '' },
          last_message: chat.last_message,
          last_message_at: chat.last_message_at,
          request_status: chat.request_status,
          unread_count: count ?? 0,
          is_request_to_me: chat.request_status === 'pending' && chat.user2_id === userId,
        }
      })
    )

    setChats(chatRows)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  const requests = chats.filter(c => c.is_request_to_me)
  const active = chats.filter(c => !c.is_request_to_me)

  if (chats.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">💬</div>
        <h3>No conversations yet</h3>
        <p>Go to the Feed and connect with someone to start chatting.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Message Requests Section */}
      {requests.length > 0 && (
        <>
          <div className="chat-section-label">Message Requests ({requests.length})</div>
          {requests.map(chat => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}
        </>
      )}

      {/* Active Chats Section */}
      {active.length > 0 && (
        <>
          {requests.length > 0 && <div className="chat-section-label" style={{ marginTop: 8 }}>Chats</div>}
          {active.map(chat => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}
        </>
      )}
    </div>
  )
}

function ChatListItem({ chat }: { chat: ChatRow }) {
  const initials = chat.other_user.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const hue = chat.other_user.full_name.charCodeAt(0) * 15 % 360
  const avatarStyle = {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 60) % 360}, 70%, 50%))`,
  }

  const timeStr = chat.last_message_at
    ? formatTime(chat.last_message_at)
    : ''

  return (
    <Link href={`/chat/${chat.id}`} className="chat-list-item">
      <div className="avatar" style={avatarStyle}>{initials}</div>
      <div className="chat-list-item-info">
        <div className="chat-list-item-top">
          <span className="chat-list-name">{chat.other_user.full_name}</span>
          <span className="chat-list-time">{timeStr}</span>
        </div>
        <div className="chat-list-bottom">
          <span className="chat-list-preview">
            {chat.is_request_to_me
              ? '👋 Wants to connect with you'
              : chat.last_message ?? 'Start the conversation...'}
          </span>
          {chat.is_request_to_me && (
            <span className="chat-request-badge">Request</span>
          )}
          {!chat.is_request_to_me && chat.unread_count > 0 && (
            <span className="chat-unread-badge">{chat.unread_count}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}
