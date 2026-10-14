/**
 * Notinst Data Access Layer (Client-facing Service Interface)
 *
 * Provides a clean abstraction between UI components and backend data sources.
 * Seamlessly handles:
 *  - MOCK MODE (when Instagram is disconnected or unconfigured)
 *  - INSTAGRAM CONNECTED (when authenticated with live Instagram Professional account)
 *  - CONNECTION ERROR (with graceful fallback to preserved data)
 *
 * UI components NEVER communicate with Meta APIs directly.
 */

import {
  MOCK_POSTS,
  MOCK_STORY_GROUPS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_PROFILE,
} from './mockData';
import type {
  Post,
  StoryGroup,
  Conversation,
  Message,
  FullProfile,
  Comment,
  ConnectionInfo,
} from './types';

// Lightweight in-memory client cache for fast tab navigation
const clientCache = new Map<string, { data: unknown; expiresAt: number }>();

function getFromClientCache<T>(key: string): T | null {
  const item = clientCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    clientCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setToClientCache<T>(key: string, data: T, ttlSeconds = 60): void {
  clientCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function invalidateClientCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    clientCache.clear();
    return;
  }
  for (const k of clientCache.keys()) {
    if (k.startsWith(keyPrefix)) clientCache.delete(k);
  }
}

// ─── 1. Connection State ───────────────────────────────────────────────────

export async function getConnectionInfo(): Promise<ConnectionInfo> {
  const cached = getFromClientCache<ConnectionInfo>('connection_info');
  if (cached) return cached;

  try {
    const res = await fetch('/api/instagram/connection');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ConnectionInfo;
    setToClientCache('connection_info', data, 30);
    return data;
  } catch (err: unknown) {
    return {
      state: 'NOT_CONNECTED',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── 2. Profile ────────────────────────────────────────────────────────────

export interface ProfileResponse {
  profile: FullProfile;
  source: 'instagram' | 'mock';
  connected: boolean;
  error?: string;
}

export async function getMyProfile(bypassCache = false): Promise<ProfileResponse> {
  if (!bypassCache) {
    const cached = getFromClientCache<ProfileResponse>('profile_data');
    if (cached) return cached;
  }

  try {
    const res = await fetch('/api/instagram/profile');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ProfileResponse;
    setToClientCache('profile_data', data, 120);
    return data;
  } catch {
    return {
      profile: MOCK_PROFILE,
      source: 'mock',
      connected: false,
    };
  }
}

// ─── 3. Feed & Latest Activity ─────────────────────────────────────────────

export interface FeedResponse {
  posts: Post[];
  source: 'instagram' | 'mock';
  connected: boolean;
  error?: string;
}

export async function getFeedPosts(bypassCache = false): Promise<FeedResponse> {
  if (!bypassCache) {
    const cached = getFromClientCache<FeedResponse>('feed_posts');
    if (cached) return cached;
  }

  try {
    const res = await fetch('/api/instagram/feed');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as FeedResponse;
    setToClientCache('feed_posts', data, 60);
    return data;
  } catch {
    return {
      posts: MOCK_POSTS,
      source: 'mock',
      connected: false,
    };
  }
}

// ─── 4. Stories ────────────────────────────────────────────────────────────

export async function getStoryGroups(): Promise<StoryGroup[]> {
  // Meta's official API does NOT support third-party following stories.
  // Returns mock stories to preserve distraction-free visual demo.
  return MOCK_STORY_GROUPS;
}

// ─── 5. Direct Messages ────────────────────────────────────────────────────

export interface ConversationsResponse {
  conversations: Conversation[];
  source: 'instagram' | 'mock';
  connected: boolean;
  restrictionNotice?: string;
  error?: string;
}

export async function getConversations(bypassCache = false): Promise<ConversationsResponse> {
  if (!bypassCache) {
    const cached = getFromClientCache<ConversationsResponse>('conversations_data');
    if (cached) return cached;
  }

  try {
    const res = await fetch('/api/instagram/conversations');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ConversationsResponse;
    setToClientCache('conversations_data', data, 30);
    return data;
  } catch {
    return {
      conversations: MOCK_CONVERSATIONS,
      source: 'mock',
      connected: false,
    };
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return MOCK_MESSAGES[conversationId] ?? [];
}

export async function sendMessage(params: {
  conversationId?: string;
  recipientId?: string;
  text: string;
}): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const res = await fetch('/api/instagram/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send message.' };
    }

    return { success: true, message: data.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── 6. Post Comments ──────────────────────────────────────────────────────

export async function getMediaComments(mediaId: string): Promise<Comment[]> {
  try {
    const res = await fetch(`/api/instagram/media/${encodeURIComponent(mediaId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.comments || [];
  } catch {
    return [];
  }
}

export async function postComment(
  mediaId: string,
  text: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const res = await fetch('/api/instagram/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, text }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to post comment.' };
    }

    return { success: true, comment: data.comment };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── 7. Content Publishing ─────────────────────────────────────────────────

export interface PublishParams {
  mediaType: 'IMAGE' | 'VIDEO' | 'REELS';
  mediaUrl: string;
  caption: string;
}

export async function publishMedia(
  params: PublishParams
): Promise<{
  success: boolean;
  mediaId?: string;
  message?: string;
  error?: string;
  isPublicUrlRequired?: boolean;
}> {
  try {
    const res = await fetch('/api/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to publish media.',
        isPublicUrlRequired: data.isPublicUrlRequired,
      };
    }

    invalidateClientCache('profile_');
    invalidateClientCache('feed_');

    return {
      success: true,
      mediaId: data.mediaId,
      message: data.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
