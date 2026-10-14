import { NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import { MOCK_CONVERSATIONS } from '@/lib/mockData';
import type { Conversation, User, Message } from '@/lib/types';

export async function GET() {
  const session = await getStoredInstagramSession();
  if (!session) {
    return NextResponse.json({
      connected: false,
      source: 'mock',
      conversations: MOCK_CONVERSATIONS,
    });
  }

  const cacheKey = `conversations_${session.userId}`;
  const cached = apiCache.get<Conversation[]>(cacheKey);
  if (cached) {
    return NextResponse.json({
      connected: true,
      source: 'instagram',
      conversations: cached,
    });
  }

  try {
    const client = new InstagramClient(session.accessToken);
    const convRes = await client.getConversations();
    const rawConversations = convRes.data || [];

    const conversations: Conversation[] = rawConversations.map((c) => {
      const participants: User[] = (c.participants?.data || []).map((p) => ({
        id: p.id,
        username: p.username || p.name || 'instagram_user',
        displayName: p.name || p.username || 'Instagram User',
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${p.id}&backgroundColor=c0aede`,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      }));

      const lastMessage: Message | null = {
        id: `msg-${c.id}`,
        conversationId: c.id,
        senderId: participants[0]?.id || 'unknown',
        text: 'Direct message on Instagram',
        createdAt: c.updated_time,
        status: 'delivered',
      };

      return {
        id: c.id,
        participants: participants.length > 0 ? participants : [
          {
            id: 'participant',
            username: 'instagram_chat',
            displayName: 'Direct Chat',
            avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=chat&backgroundColor=c0aede',
            bio: '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
          }
        ],
        lastMessage,
        unreadCount: c.unread_count ?? 0,
        updatedAt: c.updated_time,
      };
    });

    apiCache.set(cacheKey, conversations, 30); // 30 sec cache

    return NextResponse.json({
      connected: true,
      source: 'instagram',
      conversations: conversations.length > 0 ? conversations : MOCK_CONVERSATIONS,
      isRealEmpty: conversations.length === 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      connected: true,
      source: 'mock',
      conversations: MOCK_CONVERSATIONS,
      restrictionNotice:
        'Messenger API for Instagram requires a linked Facebook Page and approved Advanced Access in production. Showing test conversations.',
      error: message,
    });
  }
}
