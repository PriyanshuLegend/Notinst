'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostsGrid from '@/components/profile/PostsGrid';
import ConnectionBadge from '@/components/layout/ConnectionBadge';
import { getMyProfile } from '@/lib/api';
import { MOCK_PROFILE } from '@/lib/mockData';
import type { FullProfile } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<FullProfile>(MOCK_PROFILE);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getMyProfile()
      .then((res) => {
        if (mounted) {
          setProfile(res.profile);
          setIsConnected(res.connected && res.source === 'instagram');
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
          <h1 className="text-[17px] font-bold text-zinc-900 dark:text-white">
            {profile.username}
          </h1>
          <ConnectionBadge />
        </div>
      }
    >
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={24} className="animate-spin text-purple-600" />
          <span className="text-[13px]">Loading profile...</span>
        </div>
      ) : (
        <>
          <ProfileHeader profile={profile} isConnected={isConnected} />
          <PostsGrid profile={profile} />
        </>
      )}
    </AppShell>
  );
}
