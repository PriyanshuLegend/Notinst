'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Settings, Sparkles, CheckCircle2 } from 'lucide-react';
import type { FullProfile } from '@/lib/types';
import { formatCount } from '@/lib/utils';

interface ProfileHeaderProps {
  profile: FullProfile;
  isConnected?: boolean;
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <span className="text-[16px] font-semibold text-zinc-900 dark:text-white tabular-nums">
        {formatCount(value)}
      </span>
      <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

export default function ProfileHeader({ profile, isConnected = false }: ProfileHeaderProps) {
  return (
    <div className="px-4 pt-5 pb-4">
      {/* Top row: avatar + stats */}
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-zinc-200 dark:ring-zinc-800 flex-shrink-0">
          <Image
            src={profile.avatarUrl}
            alt={profile.username}
            width={80}
            height={80}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>

        {/* Stats */}
        <div className="flex-1 flex">
          <StatItem label="Posts" value={profile.postsCount} />
          <StatItem label="Followers" value={profile.followersCount} />
          <StatItem label="Following" value={profile.followingCount} />
        </div>
      </div>

      {/* Name & bio */}
      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[15px] font-bold text-zinc-900 dark:text-white leading-tight">
            {profile.displayName}
          </h1>
          {isConnected && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={11} />
              Connected
            </span>
          )}
        </div>
        {profile.bio && (
          <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-line">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          id="profile-edit-btn"
          className="flex-1 py-1.5 rounded-lg text-[13px] font-semibold
                     bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white
                     hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]"
        >
          Edit profile
        </button>
        <button
          id="profile-share-btn"
          className="flex-1 py-1.5 rounded-lg text-[13px] font-semibold
                     bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white
                     hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.98]"
        >
          Share profile
        </button>
        <Link
          href="/diagnostics"
          id="profile-settings-btn"
          className="px-3 py-1.5 rounded-lg flex items-center justify-center
                     bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                     hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Settings & Instagram Diagnostics"
          title="Instagram Diagnostics"
        >
          <Settings size={17} />
        </Link>
      </div>

      {/* Connection Callout if in Mock Mode */}
      {!isConnected && (
        <div className="mt-3.5 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
            <Sparkles size={16} className="flex-shrink-0" />
            <span>Connect your Professional Instagram account</span>
          </div>
          <Link
            href="/diagnostics"
            className="px-2.5 py-1 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex-shrink-0"
          >
            Connect
          </Link>
        </div>
      )}
    </div>
  );
}
