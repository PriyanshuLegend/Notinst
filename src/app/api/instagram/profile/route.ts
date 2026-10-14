import { NextResponse } from 'next/server';
import {
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import { MOCK_PROFILE } from '@/lib/mockData';
import type { FullProfile, ProfilePost, ProfileReel } from '@/lib/types';

export async function GET() {
  const session = await getStoredInstagramSession();
  if (!session) {
    return NextResponse.json({
      connected: false,
      source: 'mock',
      profile: MOCK_PROFILE,
    });
  }

  const cacheKey = `profile_full_${session.userId}`;
  const cached = apiCache.get<FullProfile>(cacheKey);
  if (cached) {
    return NextResponse.json({
      connected: true,
      source: 'instagram',
      profile: cached,
    });
  }

  try {
    const client = new InstagramClient(session.accessToken);
    const [user, mediaRes] = await Promise.all([
      client.getCurrentUser(),
      client.getMedia(30),
    ]);

    const rawMedia = mediaRes.data || [];

    // Map media to profile posts
    const posts: ProfilePost[] = rawMedia.map((m) => {
      const isVideo = m.media_type === 'VIDEO' || m.media_product_type === 'REELS';
      const thumbnail = isVideo ? m.thumbnail_url || m.media_url || '' : m.media_url || '';
      return {
        id: m.id,
        thumbnailUrl: thumbnail,
        likesCount: m.like_count ?? 0,
        commentsCount: m.comments_count ?? 0,
        mediaType: isVideo ? 'video' : 'image',
        isMultipleMedia: m.media_type === 'CAROUSEL_ALBUM',
      };
    });

    // Map media to reels tab
    const reels: ProfileReel[] = rawMedia
      .filter((m) => m.media_product_type === 'REELS' || m.media_type === 'VIDEO')
      .map((m) => ({
        id: m.id,
        thumbnailUrl: m.thumbnail_url || m.media_url || '',
        viewsCount: (m.like_count ?? 0) * 3,
        duration: 30,
      }));

    const fullProfile: FullProfile = {
      id: user.id,
      username: user.username,
      displayName: user.name || user.username,
      avatarUrl:
        user.profile_picture_url ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&backgroundColor=b6e3f4`,
      bio: `${user.account_type ? user.account_type.charAt(0) + user.account_type.slice(1).toLowerCase() : 'Professional'} Account • Connected via official Instagram API`,
      followersCount: 0,
      followingCount: 0,
      postsCount: user.media_count ?? posts.length,
      posts,
      reels,
      taggedPosts: [],
    };

    apiCache.set(cacheKey, fullProfile, 180); // 3 minutes cache

    return NextResponse.json({
      connected: true,
      source: 'instagram',
      profile: fullProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // On error, return mock data gracefully with error notice
    return NextResponse.json({
      connected: true,
      source: 'mock',
      profile: MOCK_PROFILE,
      error: `Failed to fetch live Instagram profile: ${message}`,
    });
  }
}
