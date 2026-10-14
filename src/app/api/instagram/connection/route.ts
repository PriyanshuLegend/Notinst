import { NextResponse } from 'next/server';
import {
  isInstagramConfigured,
  getStoredInstagramSession,
  InstagramClient,
  apiCache,
} from '@/lib/instagram';
import type { ConnectionInfo } from '@/lib/types';

export async function GET() {
  const configured = isInstagramConfigured();
  if (!configured) {
    const info: ConnectionInfo = {
      state: 'NOT_CONNECTED',
      error: 'Not configured in environment variables.',
    };
    return NextResponse.json(info);
  }

  const session = await getStoredInstagramSession();
  if (!session) {
    const info: ConnectionInfo = {
      state: 'NOT_CONNECTED',
    };
    return NextResponse.json(info);
  }

  // Check cache first (TTL 60 seconds)
  const cacheKey = `connection_${session.userId}`;
  const cached = apiCache.get<ConnectionInfo>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = new InstagramClient(session.accessToken);
    const user = await client.getCurrentUser();

    const info: ConnectionInfo = {
      state: 'CONNECTED',
      username: user.username,
      userId: user.id,
      accountType: user.account_type || 'PROFESSIONAL',
      avatarUrl: user.profile_picture_url,
    };

    apiCache.set(cacheKey, info, 60);
    return NextResponse.json(info);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const info: ConnectionInfo = {
      state: 'CONNECTION_ERROR',
      username: session.username,
      userId: session.userId,
      error: message,
    };
    return NextResponse.json(info);
  }
}
