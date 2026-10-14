import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sparkles,
  KeyRound,
  FileText,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import {
  isInstagramConfigured,
  getInstagramConfig,
  getStoredInstagramSession,
  InstagramClient,
  type InstagramDiagnosticsReport,
  type ApiCapabilityDetail,
} from '@/lib/instagram';

interface DiagnosticsPageProps {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
}

export default async function DiagnosticsPage({ searchParams }: DiagnosticsPageProps) {
  const params = await searchParams;
  const configured = isInstagramConfigured();
  const config = getInstagramConfig();
  const session = await getStoredInstagramSession();

  let liveReport: InstagramDiagnosticsReport | null = null;
  let connectionError: string | null = params.error || null;

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
      feature: 'Following Feed (Timeline from followed accounts)',
      status: 'unsupported',
      verified: false,
      permissionRequired: 'N/A (No API Exists)',
      endpoint: 'None',
      notes: 'STRICTLY UNSUPPORTED by Meta. The official Graph API does not provide a home timeline or followed accounts feed.',
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

  if (configured && session) {
    try {
      const client = new InstagramClient(session.accessToken);
      liveReport = await client.testCapabilities();
      liveReport.grantedScopes = session.scopes;
    } catch (err: unknown) {
      connectionError =
        err instanceof Error ? err.message : 'Failed to query Instagram API with saved session.';
    }
  }

  const capabilities = liveReport ? liveReport.capabilities : baseCapabilities;
  const user = liveReport?.user;
  const isAuthenticated = Boolean(session && liveReport?.isAuthenticated);

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
              aria-label="Back to profile"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-[16px] font-bold text-zinc-900 dark:text-white leading-none">
                API Diagnostics
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Official Meta & Instagram Graph API
              </p>
            </div>
          </div>
          <Link
            href="/diagnostics"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
            title="Refresh status"
          >
            <RefreshCw size={16} />
          </Link>
        </div>
      }
    >
      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* Status Banners */}
        {params.status === 'connected' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px]">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Instagram Connected Successfully</p>
              <p className="text-[12px] opacity-90">
                Your Professional account has been authenticated via official Instagram Login.
              </p>
            </div>
          </div>
        )}

        {connectionError && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px]">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication / API Notice</p>
              <p className="text-[12px] opacity-90 break-words">{connectionError}</p>
            </div>
          </div>
        )}

        {/* 1. Account & Connection Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Account Connection
            </span>
            {isAuthenticated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Instagram Connected
              </span>
            ) : configured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Ready to Connect
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Not Configured (Mock Mode)
              </span>
            )}
          </div>

          {isAuthenticated && user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 pt-1">
                {user.profile_picture_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-emerald-500/30 flex-shrink-0">
                    <Image
                      src={user.profile_picture_url}
                      alt={user.username}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate">
                      @{user.username}
                    </h2>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {user.account_type || 'PROFESSIONAL'}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                    ID: {user.id}
                  </p>
                  {typeof user.media_count === 'number' && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {user.media_count} media uploads on Instagram
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <form action="/api/auth/instagram/logout" method="POST" className="flex-1">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[13px] font-medium bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <LogOut size={15} />
                    Disconnect Account
                  </button>
                </form>
              </div>
            </div>
          ) : configured ? (
            <div className="space-y-3 pt-1">
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300">
                Your Meta app credentials are set up. Connect your Instagram Professional (Creator/Business) account to test permissions.
              </p>
              <a
                href="/api/auth/instagram/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md active:scale-[0.99] transition-all"
              >
                <Sparkles size={16} />
                Connect Instagram (Professional Account)
              </a>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Notinst is currently operating in <strong>Mock Mode</strong>. To connect your live Instagram Professional account, configure your Meta App credentials in <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[12px] font-mono text-pink-600 dark:text-pink-400">.env.local</code>.
              </p>
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-[12px] font-mono text-zinc-700 dark:text-zinc-300 space-y-1">
                <p>INSTAGRAM_CLIENT_ID=&lt;your_meta_app_id&gt;</p>
                <p>INSTAGRAM_CLIENT_SECRET=&lt;your_meta_app_secret&gt;</p>
                <p>INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Granted Scopes / Permissions */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} />
              Official Permission Scopes (2025/2026)
            </span>
          </div>

          <div className="space-y-2 text-[12px]">
            {config.scopes.map((scope) => (
              <div
                key={scope}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
                    {scope}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {scope === 'instagram_business_basic' && 'Read basic profile info and own media/Reels'}
                    {scope === 'instagram_business_manage_messages' && '1:1 Messenger API for Direct Messages'}
                    {scope === 'instagram_business_manage_comments' && 'Read & reply to comments on own posts'}
                    {scope === 'instagram_business_content_publish' && 'Two-step media container publishing'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {isAuthenticated ? 'Active' : 'Configured'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Capability Verification Matrix */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} />
              API Capabilities Investigation
            </span>
          </div>

          <div className="space-y-2">
            {capabilities.map((cap) => (
              <div
                key={cap.feature}
                className="p-3 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {cap.feature}
                  </span>
                  {cap.status === 'supported' ? (
                    cap.verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Supported
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <XCircle size={12} />
                      Unsupported
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
                  {cap.notes}
                </p>
                {cap.endpoint && (
                  <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    {cap.endpoint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Documentation Links */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} />
            Integration Documentation
          </span>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <a
              href="/docs/instagram-api-capabilities.md"
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors text-[13px] text-zinc-800 dark:text-zinc-200"
            >
              <span>docs/instagram-api-capabilities.md</span>
              <ExternalLink size={14} className="text-zinc-400" />
            </a>
            <a
              href="/docs/instagram-integration.md"
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors text-[13px] text-zinc-800 dark:text-zinc-200"
            >
              <span>docs/instagram-integration.md</span>
              <ExternalLink size={14} className="text-zinc-400" />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
