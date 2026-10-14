import { NextResponse } from 'next/server';
import {
  isInstagramConfigured,
  getInstagramConfig,
  getStoredInstagramSession,
  InstagramClient,
  type InstagramDiagnosticsReport,
  type ApiCapabilityDetail,
} from '@/lib/instagram';

export async function GET() {
  const configured = isInstagramConfigured();
  const config = getInstagramConfig();
  const session = await getStoredInstagramSession();

  const baseCapabilities: ApiCapabilityDetail[] = [
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

  if (!configured) {
    const report: InstagramDiagnosticsReport = {
      isConfigured: false,
      isAuthenticated: false,
      user: null,
      grantedScopes: [],
      capabilities: baseCapabilities,
      error: 'Instagram credentials are not configured in environment variables.',
    };
    return NextResponse.json(report);
  }

  if (!session) {
    const report: InstagramDiagnosticsReport = {
      isConfigured: true,
      isAuthenticated: false,
      user: null,
      grantedScopes: config.scopes,
      capabilities: baseCapabilities,
      error: null,
    };
    return NextResponse.json(report);
  }

  // Session exists — test real Instagram Graph API
  try {
    const client = new InstagramClient(session.accessToken);
    const liveReport = await client.testCapabilities();
    liveReport.grantedScopes = session.scopes;
    return NextResponse.json(liveReport);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const report: InstagramDiagnosticsReport = {
      isConfigured: true,
      isAuthenticated: true,
      user: null,
      grantedScopes: session.scopes,
      capabilities: baseCapabilities,
      error: `Failed to communicate with Instagram API: ${message}`,
    };
    return NextResponse.json(report);
  }
}
