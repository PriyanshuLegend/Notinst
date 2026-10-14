import { NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import { MOCK_POSTS } from '@/lib/mockData';
import type { Post, User } from '@/lib/types';

export async function GET() {
  const session = await getStoredInstagramSession();
  if (!session) {
    return NextResponse.json({
      connected: false,
      source: 'mock',
      posts: MOCK_POSTS,
    });
  }

  const cacheKey = `feed_latest_${session.userId}`;
  const cached = apiCache.get<Post[]>(cacheKey);
  if (cached) {
    return NextResponse.json({
      connected: true,
      source: 'instagram',
      posts: cached,
    });
  }

  try {
    const client = new InstagramClient(session.accessToken);
    const [user, mediaRes] = await Promise.all([
      client.getCurrentUser(),
      client.getMedia(15),
    ]);

    const postUser: User = {
      id: user.id,
      username: user.username,
      displayName: user.name || user.username,
      avatarUrl:
        user.profile_picture_url ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&backgroundColor=b6e3f4`,
      bio: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: user.media_count || 0,
    };

    const rawMedia = mediaRes.data || [];
    const posts: Post[] = rawMedia.map((m) => {
      const isVideo = m.media_type === 'VIDEO' || m.media_product_type === 'REELS';
      const mediaUrl = isVideo ? m.media_url || m.thumbnail_url || '' : m.media_url || '';

      return {
        id: m.id,
        userId: user.id,
        user: postUser,
        media: [
          {
            id: `${m.id}-med`,
            url: mediaUrl,
            type: isVideo ? 'video' : 'image',
          },
        ],
        caption: m.caption || '',
        likesCount: m.like_count ?? 0,
        commentsCount: m.comments_count ?? 0,
        createdAt: m.timestamp,
        isLiked: false,
        isSaved: false,
        previewComments: [],
      };
    });

    apiCache.set(cacheKey, posts, 120); // 2 min cache

    return NextResponse.json({
      connected: true,
      source: 'instagram',
      posts: posts.length > 0 ? posts : MOCK_POSTS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      connected: true,
      source: 'mock',
      posts: MOCK_POSTS,
      error: `Failed to load live Instagram feed: ${message}`,
    });
  }
}
