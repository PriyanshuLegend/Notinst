import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeCodeForTokens,
  setInstagramSession,
  InstagramClient,
} from '@/lib/instagram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Check for OAuth errors returned by Meta
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');

  if (error || errorReason) {
    const errorMsg = errorDescription || errorReason || error || 'Unknown OAuth error';
    const redirectUrl = new URL('/diagnostics', request.url);
    redirectUrl.searchParams.set('error', errorMsg);
    return NextResponse.redirect(redirectUrl);
  }

  const code = searchParams.get('code');
  if (!code) {
    const redirectUrl = new URL('/diagnostics', request.url);
    redirectUrl.searchParams.set('error', 'missing_authorization_code');
    return NextResponse.redirect(redirectUrl);
  }

  // Verify CSRF state (optional strictness for local development)
  const returnedState = searchParams.get('state');
  const cookieStore = await cookies();
  const savedState = cookieStore.get('notinst_oauth_state')?.value;

  if (savedState && returnedState && savedState !== returnedState) {
    const redirectUrl = new URL('/diagnostics', request.url);
    redirectUrl.searchParams.set('error', 'invalid_oauth_state');
    return NextResponse.redirect(redirectUrl);
  }

  // Clear state cookie
  cookieStore.delete('notinst_oauth_state');

  try {
    // Exchange code for tokens
    const session = await exchangeCodeForTokens(code);

    // Fetch user info to populate username
    try {
      const client = new InstagramClient(session.accessToken);
      const user = await client.getCurrentUser();
      session.username = user.username;
    } catch {
      // Non-fatal if profile fetch fails immediately
    }

    // Securely save session in httpOnly cookie
    await setInstagramSession(session);

    const redirectUrl = new URL('/diagnostics', request.url);
    redirectUrl.searchParams.set('status', 'connected');
    return NextResponse.redirect(redirectUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const redirectUrl = new URL('/diagnostics', request.url);
    redirectUrl.searchParams.set('error', message);
    return NextResponse.redirect(redirectUrl);
  }
}
