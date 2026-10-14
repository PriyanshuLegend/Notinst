/**
 * TypeScript types for Instagram Graph API integration.
 */

// ─── OAuth & Token Types ───────────────────────────────────────────────────

export interface InstagramOAuthTokenResponse {
  access_token: string;
  user_id: string; // The Instagram user ID (or app-scoped user ID)
  permissions?: string[];
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Seconds until expiration (typically 5184000 = 60 days)
}

export interface InstagramSessionData {
  accessToken: string;
  userId: string;
  username?: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp in ms
  scopes: string[];
}

export interface InstagramAuthError {
  error: string;
  error_reason?: string;
  error_description?: string;
}

// ─── Instagram Graph API Entities ──────────────────────────────────────────

export interface InstagramApiUser {
  id: string;
  username: string;
  name?: string;
  account_type?: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  profile_picture_url?: string;
  media_count?: number;
}

export interface InstagramApiMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string; // ISO 8601
  like_count?: number;
  comments_count?: number;
  media_product_type?: 'FEED' | 'STORY' | 'REELS';
  children?: {
    data: Array<{
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
    }>;
  };
}

export interface InstagramApiComment {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  hidden?: boolean;
  replies?: {
    data: InstagramApiComment[];
  };
}

export interface InstagramApiConversation {
  id: string;
  updated_time: string;
  participants?: {
    data: Array<{
      id: string;
      username?: string;
      name?: string;
    }>;
  };
  unread_count?: number;
}

export interface InstagramApiMessage {
  id: string;
  created_time: string;
  from?: {
    id: string;
    username?: string;
  };
  to?: {
    data: Array<{
      id: string;
      username?: string;
    }>;
  };
  message?: string;
}

// ─── Content Publishing API ────────────────────────────────────────────────

export interface CreateMediaContainerParams {
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'REELS';
  coverUrl?: string;
  thumbOffset?: number;
}

export interface MediaContainerResponse {
  id: string; // Creation ID
}

export interface MediaPublishResponse {
  id: string; // Published Media ID
}

export interface MediaContainerStatusResponse {
  id: string;
  status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  status?: string;
}

// ─── Diagnostics & Capability Matrix ───────────────────────────────────────

export type ApiCapabilityStatus = 'supported' | 'unsupported';

export interface ApiCapabilityDetail {
  feature: string;
  status: ApiCapabilityStatus;
  verified: boolean;
  permissionRequired?: string;
  endpoint?: string;
  notes: string;
}

export interface InstagramDiagnosticsReport {
  isConfigured: boolean;
  isAuthenticated: boolean;
  user?: InstagramApiUser | null;
  grantedScopes?: string[];
  capabilities: ApiCapabilityDetail[];
  error?: string | null;
}
