import { NextRequest, NextResponse } from 'next/server';
import { clearInstagramSession } from '@/lib/instagram';

export async function GET(request: NextRequest) {
  await clearInstagramSession();
  const redirectUrl = new URL('/diagnostics', request.url);
  redirectUrl.searchParams.set('status', 'disconnected');
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  await clearInstagramSession();
  const redirectUrl = new URL('/diagnostics', request.url);
  redirectUrl.searchParams.set('status', 'disconnected');
  return NextResponse.redirect(redirectUrl);
}
