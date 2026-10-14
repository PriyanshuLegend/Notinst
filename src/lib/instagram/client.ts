import { INSTAGRAM_ENDPOINTS } from './config';
import type {
  InstagramApiUser,
  InstagramApiMedia,
  InstagramApiComment,
  InstagramApiConversation,
  CreateMediaContainerParams,
  MediaContainerResponse,
  MediaPublishResponse,
  MediaContainerStatusResponse,
  InstagramDiagnosticsReport,
  ApiCapabilityDetail,
} from './types';

/**
 * Server-side Instagram Graph API Client.
 * All requests are executed with the user's valid Bearer token.
 *
 * ONLY officially supported Meta/Instagram Graph API endpoints are implemented.
 * Unsupported features (such as reading third-party following feeds) are intentionally
 * omitted and marked as unsupported.
 */
export class InstagramClient {
  private accessToken: string;
  private baseUrl: string;

  constructor(
    accessToken: string,
    baseUrl: string = INSTAGRAM_ENDPOINTS.GRAPH_INSTAGRAM
  ) {
    this.accessToken = accessToken;
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http')
      ? new URL(endpoint)
      : new URL(`${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);

    // Attach access_token parameter or header
    if (!url.searchParams.has('access_token')) {
      url.searchParams.set('access_token', this.accessToken);
    }

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    const res = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson: { error?: { message?: string; type?: string; code?: number } } = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // use raw text
      }

      const message =
        errorJson.error?.message ||
        `Instagram API error (${res.status} ${res.statusText}): ${errorText}`;
      throw new Error(message);
    }

    return (await res.json()) as T;
  }

  // ─── 1. Authenticated User / Profile ──────────────────────────────────────

  /**
   * Retrieves profile details for the authenticated Instagram Professional account.
   * Permission required: instagram_business_basic
   */
  async getCurrentUser(): Promise<InstagramApiUser> {
    return this.request<InstagramApiUser>(
      '/me?fields=id,username,name,account_type,profile_picture_url,media_count'
    );
  }

  // ─── 2. Own Media (Posts & Reels) ─────────────────────────────────────────

  /**
   * Retrieves media uploaded by the authenticated user.
   * Includes standard posts, carousels, and Reels.
   * Permission required: instagram_business_basic
   */
  async getMedia(limit = 25): Promise<{ data: InstagramApiMedia[]; paging?: { next?: string } }> {
    return this.request<{ data: InstagramApiMedia[]; paging?: { next?: string } }>(
      `/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,media_product_type&limit=${limit}`
    );
  }

  /**
   * Retrieves single media item by ID.
   * Permission required: instagram_business_basic
   */
  async getMediaById(mediaId: string): Promise<InstagramApiMedia> {
    return this.request<InstagramApiMedia>(
      `/${mediaId}?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,media_product_type,children{id,media_type,media_url}`
    );
  }

  // ─── 3. Comments Moderation ───────────────────────────────────────────────

  /**
   * Retrieves top-level comments on a specific media item.
   * Permission required: instagram_business_manage_comments
   */
  async getComments(
    mediaId: string
  ): Promise<{ data: InstagramApiComment[]; paging?: { next?: string } }> {
    return this.request<{ data: InstagramApiComment[]; paging?: { next?: string } }>(
      `/${mediaId}/comments?fields=id,text,timestamp,username,like_count,hidden`
    );
  }

  /**
   * Posts a comment on a media item.
   * Permission required: instagram_business_manage_comments
   */
  async postComment(mediaId: string, message: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/${mediaId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  }

  // ─── 4. Direct Messages / Conversations ──────────────────────────────────

  /**
   * Retrieves conversations for the professional account.
   * Note: The Messenger API for Instagram typically routes through graph.facebook.com
   * or graph.instagram.com/me/conversations.
   * Permission required: instagram_business_manage_messages
   */
  async getConversations(): Promise<{ data: InstagramApiConversation[] }> {
    try {
      return await this.request<{ data: InstagramApiConversation[] }>(
        '/me/conversations?fields=id,updated_time,participants,unread_count'
      );
    } catch {
      // If graph.instagram.com doesn't support the conversation endpoint directly
      // in this app mode, attempt with graph.facebook.com
      const fbClient = new InstagramClient(
        this.accessToken,
        INSTAGRAM_ENDPOINTS.GRAPH_FACEBOOK
      );
      return await fbClient.request<{ data: InstagramApiConversation[] }>(
        '/me/conversations?platform=instagram&fields=id,updated_time,participants,unread_count'
      );
    }
  }

  /**
   * Sends a 1:1 Direct Message to an Instagram-scoped user ID (IGSID).
   * Note: Governed by the 24-hour customer service window rule.
   * Permission required: instagram_business_manage_messages
   */
  async sendMessage(
    recipientId: string,
    text: string
  ): Promise<{ recipient_id: string; message_id: string }> {
    return this.request<{ recipient_id: string; message_id: string }>('/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
  }

  // ─── 5. Content Publishing (2-Step Container Flow) ───────────────────────

  /**
   * Step 1 of Content Publishing: Creates a media container.
   * Permission required: instagram_business_content_publish
   */
  async createMediaContainer(
    userId: string,
    params: CreateMediaContainerParams
  ): Promise<MediaContainerResponse> {
    const query = new URLSearchParams();

    if (params.caption) query.set('caption', params.caption);
    if (params.imageUrl) query.set('image_url', params.imageUrl);
    if (params.videoUrl) query.set('video_url', params.videoUrl);
    if (params.mediaType) query.set('media_type', params.mediaType);
    if (params.coverUrl) query.set('cover_url', params.coverUrl);

    return this.request<MediaContainerResponse>(
      `/${userId}/media?${query.toString()}`,
      { method: 'POST' }
    );
  }

  /**
   * Checks status of a media container (e.g. video processing status).
   */
  async getContainerStatus(containerId: string): Promise<MediaContainerStatusResponse> {
    return this.request<MediaContainerStatusResponse>(
      `/${containerId}?fields=id,status_code,status`
    );
  }

  /**
   * Step 2 of Content Publishing: Publishes the container to the account.
   * Permission required: instagram_business_content_publish
   */
  async publishMedia(userId: string, creationId: string): Promise<MediaPublishResponse> {
    return this.request<MediaPublishResponse>(
      `/${userId}/media_publish?creation_id=${creationId}`,
      { method: 'POST' }
    );
  }

  // ─── 6. Capability Verification & Diagnostics ────────────────────────────

  /**
   * Runs non-destructive checks to verify which Instagram capabilities
   * are active and working with the current token and permissions.
   */
  async testCapabilities(): Promise<InstagramDiagnosticsReport> {
    let user: InstagramApiUser | null = null;
    let error: string | null = null;

    const capabilities: ApiCapabilityDetail[] = [
      {
        feature: 'Profile Details',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_basic',
        endpoint: 'GET /me?fields=id,username,name,account_type,...',
        notes: 'Fetches username, account type, bio, profile photo, and media count.',
      },
      {
        feature: 'Own Posts & Carousels',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_basic',
        endpoint: 'GET /me/media',
        notes: 'Fetches uploaded photos, carousels, timestamps, like counts, and comments count.',
      },
      {
        feature: 'Own Reels',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_basic',
        endpoint: 'GET /me/media?fields=...,media_product_type',
        notes: 'Reels are returned in media list with media_product_type=REELS.',
      },
      {
        feature: 'Publishing (Photos/Reels)',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_content_publish',
        endpoint: 'POST /{ig-user-id}/media & POST /{ig-user-id}/media_publish',
        notes: 'Official two-step container publishing pipeline for professional accounts.',
      },
      {
        feature: 'Comments Moderation',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_manage_comments',
        endpoint: 'GET /{media-id}/comments',
        notes: 'Allows reading, replying to, and hiding comments on own posts.',
      },
      {
        feature: 'Direct Messages (1:1 DMs)',
        status: 'supported',
        verified: false,
        permissionRequired: 'instagram_business_manage_messages',
        endpoint: 'GET /me/conversations & POST /me/messages',
        notes: 'Messenger API for Instagram. Limited to 1:1 chats within 24-hr response window.',
      },
      {
        feature: 'Following Feed (Timeline from accounts I follow)',
        status: 'unsupported',
        verified: false,
        permissionRequired: 'N/A (No API Exists)',
        endpoint: 'None',
        notes: 'STRICTLY UNSUPPORTED by Meta. The official API provides no home timeline or followed accounts feed.',
      },
      {
        feature: "Followed Accounts' Stories",
        status: 'unsupported',
        verified: false,
        permissionRequired: 'N/A (No API Exists)',
        endpoint: 'None',
        notes: 'STRICTLY UNSUPPORTED by Meta. Only own stories can be queried via /me/stories.',
      },
    ];

    try {
      user = await this.getCurrentUser();
      const profileCap = capabilities.find((c) => c.feature === 'Profile Details');
      if (profileCap) profileCap.verified = true;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : String(err);
    }

    if (user) {
      // Test media read
      try {
        const media = await this.getMedia(3);
        const postsCap = capabilities.find((c) => c.feature === 'Own Posts & Carousels');
        if (postsCap) postsCap.verified = true;

        const hasReel = media.data?.some(
          (m) => m.media_product_type === 'REELS' || m.media_type === 'VIDEO'
        );
        const reelsCap = capabilities.find((c) => c.feature === 'Own Reels');
        if (reelsCap) reelsCap.verified = hasReel || media.data !== undefined;

        // If media has comments, test comments read on the first item
        if (media.data && media.data.length > 0) {
          try {
            await this.getComments(media.data[0].id);
            const commentsCap = capabilities.find((c) => c.feature === 'Comments Moderation');
            if (commentsCap) commentsCap.verified = true;
          } catch {
            // Comments permission might need approval or no comments exist
          }
        }
      } catch {
        // media query failed
      }

      // Test conversations
      try {
        await this.getConversations();
        const dmCap = capabilities.find((c) => c.feature === 'Direct Messages (1:1 DMs)');
        if (dmCap) dmCap.verified = true;
      } catch {
        // Conversations might require FB page link or advanced access
      }
    }

    return {
      isConfigured: true,
      isAuthenticated: Boolean(user),
      user,
      capabilities,
      error,
    };
  }
}
