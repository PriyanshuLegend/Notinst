import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import type { Comment } from '@/lib/types';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const session = await getStoredInstagramSession();

  if (!session) {
    return NextResponse.json({
      error: 'Not authenticated with Instagram.',
      comments: [],
    });
  }

  const cacheKey = `media_comments_${id}`;
  const cached = apiCache.get<Comment[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ comments: cached });
  }

  try {
    const client = new InstagramClient(session.accessToken);
    const commentsRes = await client.getComments(id);
    const rawComments = commentsRes.data || [];

    const comments: Comment[] = rawComments.map((c) => ({
      id: c.id,
      userId: c.username || 'user',
      user: {
        id: c.username || 'user',
        username: c.username || 'user',
        displayName: c.username || 'Instagram User',
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${c.username || 'user'}&backgroundColor=e2e8f0`,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      },
      text: c.text,
      createdAt: c.timestamp,
      likesCount: c.like_count ?? 0,
    }));

    apiCache.set(cacheKey, comments, 60);

    return NextResponse.json({ comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, comments: [] });
  }
}
