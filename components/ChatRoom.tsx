'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import type { Message, Profile } from '@/lib/supabase'

interface ChatRoomProps {
  chatId: string
  currentUserId: string
  otherUser: Profile
  initialMessages: Message[]
  requestStatus: 'pending' | 'accepted' | 'declined'
  isUser1: boolean
}

export default function ChatRoom({
  chatId,
  currentUserId,
  otherUser,
  initialMessages,
  requestStatus: initialRequestStatus,
  isUser1,
}: ChatRoomProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  const isRecipient = !isUser1
  const isPending = requestStatus === 'pending'
  const isAccepted = requestStatus === 'accepted'

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    // Mark messages as read on open
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('receiver_id', currentUserId)
      .is('read_at', null)
      .then(() => {})

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Mark as read if it's for us
        if (newMsg.receiver_id === currentUserId) {
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id)
            .then(() => {})
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`,
      }, (payload) => {
        const updated = payload.new as { request_status: 'pending' | 'accepted' | 'declined' }
        setRequestStatus(updated.request_status)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage() {
    const trimmed = text.trim()
    if (!trimmed || sending || !isAccepted) return

    setSending(true)
    setText('')

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      content: trimmed,
    })

    if (!error) {
      // Update chat's last_message
      await supabase.from('chats').update({
        last_message: trimmed,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', chatId)
    }

    setSending(false)
  }

  async function handleAccept() {
    await supabase.from('chats').update({ request_status: 'accepted' }).eq('id', chatId)
    setRequestStatus('accepted')
  }

  async function handleDecline() {
    await supabase.from('chats').update({ request_status: 'declined' }).eq('id', chatId)
    router.push('/chat')
  }

  async function handleBlock() {
    setMenuOpen(false)
    await supabase.from('blocked_users').insert({
      blocker_id: currentUserId,
      blocked_id: otherUser.id,
    })
    await supabase.from('chats').update({ request_status: 'declined' }).eq('id', chatId)
    router.push('/feed')
  }

  async function handleReport() {
    setReportSending(true)
    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_id: otherUser.id,
      chat_id: chatId,
      reason: reportReason,
    })
    setReportSending(false)
    setReportModalOpen(false)
    setReportReason('')
  }

  // Keyboard send
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const initials = otherUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const hue = otherUser.full_name.charCodeAt(0) * 15 % 360
  const avatarStyle = { background: `linear-gradient(135deg, hsl(${hue},70%,50%), hsl(${(hue+60)%360},70%,50%))` }

  return (
    <>
      <div className="chat-room-page">
        {/* Header */}
        <div className="chat-room-header">
          <button className="chat-room-back" onClick={() => router.push('/chat')} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="avatar avatar-sm" style={avatarStyle}>{initials}</div>
          <div className="chat-room-header-info">
            <div className="chat-room-header-name">{otherUser.full_name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{otherUser.role}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className="chat-room-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => { setMenuOpen(false); setReportModalOpen(true) }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Report User
                </button>
                <button className="dropdown-item danger" onClick={handleBlock}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Request Banner */}
        {isPending && isRecipient && (
          <div className="message-request-banner">
            <div className="message-request-title">Message Request</div>
            <div className="message-request-text">
              {otherUser.full_name} wants to connect with you. Accept to start chatting.
            </div>
            <div className="message-request-actions">
              <button className="btn btn-danger btn-sm" onClick={handleDecline}>Decline</button>
              <button className="btn btn-primary btn-sm" onClick={handleAccept}>Accept</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="chat-room-messages" onClick={() => setMenuOpen(false)}>
          {messages.length === 0 && isAccepted && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">👋</div>
              <h3 style={{ fontSize: '1rem' }}>Say hello!</h3>
              <p style={{ fontSize: '0.8rem' }}>Start the conversation with {otherUser.full_name}.</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSent={msg.sender_id === currentUserId}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          {!isAccepted ? (
            <div className="chat-input-locked">
              {isPending && isUser1
                ? '⏳ Waiting for them to accept your request...'
                : isPending && isRecipient
                ? '👆 Accept the request above to start chatting'
                : '🚫 This conversation is closed'}
            </div>
          ) : (
            <>
              <textarea
                className="chat-textarea"
                placeholder="Type a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Message input"
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-card glass-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Report {otherUser.full_name}</h3>
            <p className="modal-body">Tell us what&apos;s wrong. Our team will review this report.</p>
            <textarea
              className="form-input"
              style={{ resize: 'vertical', minHeight: 80 }}
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setReportModalOpen(false)}>Cancel</button>
              <button
                className={`btn btn-danger btn-sm ${reportSending ? 'btn-loading' : ''}`}
                onClick={handleReport}
                disabled={!reportReason.trim() || reportSending}
              >
                {!reportSending && 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MessageBubble({ message, isSent }: { message: Message; isSent: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`message-bubble-wrapper ${isSent ? 'sent' : ''}`}>
      <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
        {message.content}
        <div className="message-time">{time}</div>
      </div>
    </div>
  )
}
