import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  isInstagramConfigured,
  getAuthorizationUrl,
} from '@/lib/instagram';

export async function GET(request: NextRequest) {
  if (!isInstagramConfigured()) {
    const url = new URL('/diagnostics', request.url);
    url.searchParams.set('error', 'instagram_not_configured');
    return NextResponse.redirect(url);
  }

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const cookieStore = await cookies();

  cookieStore.set('notinst_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
