'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConnectionInfo } from '@/lib/api';
import type { ConnectionInfo } from '@/lib/types';

export default function ConnectionBadge() {
  const [info, setInfo] = useState<ConnectionInfo>({ state: 'NOT_CONNECTED' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getConnectionInfo()
      .then((data) => {
        if (mounted) {
          setInfo(data);
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

  if (loading) {
    return (
      <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  if (info.state === 'CONNECTED') {
    return (
      <Link
        href="/diagnostics"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-colors"
        title="Connected to live Instagram Professional account. Click for diagnostics."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold tracking-tight">
          {info.username ? `@${info.username}` : 'Instagram Connected'}
        </span>
      </Link>
    );
  }

  if (info.state === 'CONNECTION_ERROR') {
    return (
      <Link
        href="/diagnostics"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-colors"
        title={info.error || 'Connection notice'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>API Notice</span>
      </Link>
    );
  }

  return (
    <Link
      href="/diagnostics"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700 transition-colors"
      title="Running in distraction-free Mock Mode. Click to connect your Professional Instagram account."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
      <span>Mock Mode</span>
    </Link>
  );
}
