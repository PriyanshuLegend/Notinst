import { cookies } from 'next/headers';
import {
  getInstagramConfig,
  INSTAGRAM_ENDPOINTS,
  SESSION_COOKIE_NAME,
} from './config';
import type {
  InstagramOAuthTokenResponse,
  InstagramLongLivedTokenResponse,
  InstagramSessionData,
} from './types';

/**
 * Builds the official Instagram OAuth Authorization URL.
 * Redirects the user to Instagram to approve access to their Professional account.
 */
export function getAuthorizationUrl(state?: string): string {
  const config = getInstagramConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(','),
  });

  if (state) {
    params.set('state', state);
  }

  return `${INSTAGRAM_ENDPOINTS.AUTHORIZE}?${params.toString()}`;
}

/**
 * Exchanges the authorization code received in the callback for a short-lived token,
 * then exchanges it immediately for a 60-day long-lived access token.
 */
export async function exchangeCodeForTokens(
  rawCode: string
): Promise<InstagramSessionData> {
  const config = getInstagramConfig();

  // Instagram appends '#_' to the redirect code; strip it if present.
  const code = rawCode.replace(/#_$/, '');

  // Step 1: Exchange code for short-lived token (POST to api.instagram.com)
  const formData = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code,
  });

  const shortTokenRes = await fetch(INSTAGRAM_ENDPOINTS.TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!shortTokenRes.ok) {
    const errorBody = await shortTokenRes.text();
    throw new Error(
      `Failed to exchange authorization code for short-lived token (${shortTokenRes.status}): ${errorBody}`
    );
  }

  const shortTokenData =
    (await shortTokenRes.json()) as InstagramOAuthTokenResponse;

  // Step 2: Exchange short-lived token for long-lived token (60-day expiry)
  const longTokenUrl = new URL(
    `${INSTAGRAM_ENDPOINTS.GRAPH_INSTAGRAM}/access_token`
  );
  longTokenUrl.searchParams.set('grant_type', 'ig_exchange_token');
  longTokenUrl.searchParams.set('client_secret', config.clientSecret);
  longTokenUrl.searchParams.set('access_token', shortTokenData.access_token);

  const longTokenRes = await fetch(longTokenUrl.toString(), {
    method: 'GET',
  });

  if (!longTokenRes.ok) {
    // If long-lived exchange fails, fall back to short-lived token with 1h expiry
    return {
      accessToken: shortTokenData.access_token,
      userId: shortTokenData.user_id,
      tokenType: 'bearer',
      expiresAt: Date.now() + 3600 * 1000,
      scopes: config.scopes,
    };
  }

  const longTokenData =
    (await longTokenRes.json()) as InstagramLongLivedTokenResponse;

  return {
    accessToken: longTokenData.access_token,
    userId: shortTokenData.user_id,
    tokenType: longTokenData.token_type || 'bearer',
    expiresAt: Date.now() + (longTokenData.expires_in || 5184000) * 1000,
    scopes: config.scopes,
  };
}

/**
 * Retrieves the current Instagram session from the secure httpOnly cookie.
 */
export async function getStoredInstagramSession(): Promise<InstagramSessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;

    const session = JSON.parse(
      Buffer.from(cookie.value, 'base64').toString('utf-8')
    ) as InstagramSessionData;

    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Stores the Instagram session data in a secure, server-only httpOnly cookie.
 * Never accessible to client-side JavaScript.
 */
export async function setInstagramSession(
  session: InstagramSessionData
): Promise<void> {
  const cookieStore = await cookies();
  const serialized = Buffer.from(JSON.stringify(session)).toString('base64');

  // Cookie expiration matches token expiration or defaults to 60 days
  const maxAge = Math.floor(
    Math.max(60, (session.expiresAt - Date.now()) / 1000)
  );

  cookieStore.set(SESSION_COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Clears the Instagram session cookie.
 */
export async function clearInstagramSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
