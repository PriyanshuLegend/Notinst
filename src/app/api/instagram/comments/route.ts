import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import type { Comment } from '@/lib/types';

export async function POST(request: NextRequest) {
  const session = await getStoredInstagramSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated with Instagram.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { mediaId, text } = body;

    if (!mediaId || !text || !text.trim()) {
      return NextResponse.json(
        { error: 'mediaId and text are required.' },
        { status: 400 }
      );
    }

    const client = new InstagramClient(session.accessToken);
    const result = await client.postComment(mediaId, text.trim());

    // Invalidate comments cache for this media
    apiCache.delete(`media_comments_${mediaId}`);

    const newComment: Comment = {
      id: result.id,
      userId: session.userId,
      user: {
        id: session.userId,
        username: session.username || 'me',
        displayName: session.username || 'Me',
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${session.username || 'me'}&backgroundColor=b6e3f4`,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      },
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
