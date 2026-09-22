import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { type Profile } from '@/lib/supabase'
import ChatRoom from '@/components/ChatRoom'

interface Props {
  params: Promise<{ chatId: string }>
}

export default async function ChatRoomPage({ params }: Props) {
  const { chatId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the chat and verify the user is a participant
  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (!chat) notFound()
  if (chat.user1_id !== user.id && chat.user2_id !== user.id) redirect('/chat')

  const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id
  const isUser1 = chat.user1_id === user.id

  // Fetch other user's profile
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) notFound()

  // Fetch message history
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  return (
    <ChatRoom
      chatId={chatId}
      currentUserId={user.id}
      otherUser={otherUser}
      initialMessages={messages ?? []}
      requestStatus={chat.request_status}
      isUser1={isUser1}
    />
  )
}
