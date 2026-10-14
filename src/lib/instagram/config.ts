/**
 * Configuration for Instagram Graph API and OAuth integration.
 * All credentials are read from server-side environment variables.
 */

export const INSTAGRAM_ENDPOINTS = {
  // Instagram Login for Business authorization endpoint
  AUTHORIZE: 'https://www.instagram.com/oauth/authorize',
  // Short-lived token exchange endpoint (POST)
  TOKEN: 'https://api.instagram.com/oauth/access_token',
  // Instagram Graph API base URL (for Instagram Login tokens)
  GRAPH_INSTAGRAM: 'https://graph.instagram.com',
  // Meta Graph API base URL (for Facebook Login / Page-linked accounts)
  GRAPH_FACEBOOK: 'https://graph.facebook.com/v22.0',
} as const;

/**
 * Standard 2025/2026 Meta permission scopes for Instagram Professional accounts.
 * Note: Legacy scopes like `business_basic` were deprecated January 27, 2025.
 */
export const DEFAULT_INSTAGRAM_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
  'instagram_business_content_publish',
] as const;

export const SESSION_COOKIE_NAME = 'notinst_ig_session';

export interface InstagramConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  sessionSecret: string;
}

export function getInstagramConfig(): InstagramConfig {
  const clientId = process.env.INSTAGRAM_CLIENT_ID || '';
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || '';
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
      : 'http://localhost:3000/api/auth/instagram/callback');

  const rawScopes = process.env.INSTAGRAM_SCOPES;
  const scopes = rawScopes
    ? rawScopes.split(',').map((s) => s.trim()).filter(Boolean)
    : [...DEFAULT_INSTAGRAM_SCOPES];

  const sessionSecret =
    process.env.SESSION_SECRET || 'notinst_dev_fallback_secret_key_32chars!';

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    sessionSecret,
  };
}

/**
 * Checks whether the required Instagram OAuth credentials are configured.
 */
export function isInstagramConfigured(): boolean {
  const config = getInstagramConfig();
  return Boolean(
    config.clientId &&
      config.clientId !== 'your_instagram_app_id_here' &&
      config.clientSecret &&
      config.clientSecret !== 'your_instagram_app_secret_here' &&
      config.redirectUri
  );
}
