'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  PlusSquare,
  Video,
  MessageCircle,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import StoryRow from '@/components/feed/StoryRow';
import PostCard from '@/components/feed/PostCard';
import StoryViewer from '@/components/stories/StoryViewer';
import ConnectionBadge from '@/components/layout/ConnectionBadge';
import PublishModal from '@/components/publishing/PublishModal';
import { getFeedPosts, getStoryGroups } from '@/lib/api';
import type { Post, StoryGroup } from '@/lib/types';

export default function HomePage() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);

  // Publishing modal state
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishType, setPublishType] = useState<'IMAGE' | 'REELS'>('IMAGE');

  const loadData = async (bypassCache = false) => {
    try {
      const [feedRes, stories] = await Promise.all([
        getFeedPosts(bypassCache),
        getStoryGroups(),
      ]);
      setPosts(feedRes.posts);
      setIsLiveConnected(feedRes.connected && feedRes.source === 'instagram');
      setStoryGroups(stories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectStory = (index: number) => {
    setOpenStoryIndex(index);
  };

  const handleCloseStory = () => {
    if (openStoryIndex !== null) {
      setStoryGroups((groups) =>
        groups.map((g, i) =>
          i === openStoryIndex ? { ...g, hasUnseen: false } : g
        )
      );
    }
    setOpenStoryIndex(null);
  };

  const openPublish = (type: 'IMAGE' | 'REELS') => {
    setPublishType(type);
    setIsPublishOpen(true);
  };

  return (
    <>
      <AppShell
        header={
          <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-[19px] font-bold tracking-tight text-zinc-900 dark:text-white">
                notinst
              </span>
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                Focus
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ConnectionBadge />
              <button
                onClick={() => openPublish('IMAGE')}
                className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Create Post"
              >
                <PlusSquare size={20} />
              </button>
            </div>
          </div>
        }
      >
        {/* Quick Actions Hub */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => openPublish('IMAGE')}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlusSquare size={17} />
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                New Post
              </span>
            </button>

            <button
              onClick={() => openPublish('REELS')}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 hover:border-pink-400 dark:hover:border-pink-600 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Video size={17} />
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                New Reel
              </span>
            </button>

            <Link
              href="/messages"
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageCircle size={17} />
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Messages
              </span>
            </Link>

            <Link
              href="/profile"
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserIcon size={17} />
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Profile
              </span>
            </Link>
          </div>
        </div>

        {/* Safari Userscript Firewall Banner */}
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900/60">
          <Link
            href="/settings"
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 hover:border-blue-500/50 transition-all text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="font-semibold text-white">Safari Userscript Firewall</span>
                <p className="text-[11px] text-zinc-400">Block Reels & Explore directly on instagram.com</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-blue-400 shrink-0" />
          </Link>
        </div>

        {/* Stories (Demo/Archived Stories) */}
        {storyGroups.length > 0 && (
          <div className="border-b border-zinc-100 dark:border-zinc-900">
            <StoryRow groups={storyGroups} onSelectGroup={handleSelectStory} />
          </div>
        )}

        {/* Section Header: Latest Activity */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-zinc-900 dark:text-white">
              {isLiveConnected ? 'Your Published Activity' : 'Recent Feed Activity'}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isLiveConnected
                ? 'Directly retrieved from your connected Instagram Professional account'
                : 'Distraction-free chronological feed'}
            </p>
          </div>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 size={24} className="animate-spin text-purple-600" />
            <span className="text-[13px]">Loading activity...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">
              No recent media found
            </p>
            <p className="text-[12px] text-zinc-500 max-w-xs mx-auto">
              You haven&apos;t published any media on this account yet, or no media is accessible.
            </p>
            <button
              onClick={() => openPublish('IMAGE')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-purple-600 text-white"
            >
              <PlusSquare size={15} />
              Create your first post
            </button>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Distraction-Free Caught Up State */}
        <div className="flex flex-col items-center gap-3 py-12 px-6 text-center border-t border-zinc-100 dark:border-zinc-900">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-white">
              You&apos;re all caught up
            </p>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              No endless recommendation reels, no algorithmic explore feed, and no addictive rabbit holes.
            </p>
          </div>
        </div>
      </AppShell>

      {/* Story viewer overlay */}
      {openStoryIndex !== null && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={openStoryIndex}
          onClose={handleCloseStory}
        />
      )}

      {/* Content Publishing Modal */}
      <PublishModal
        isOpen={isPublishOpen}
        defaultType={publishType}
        onClose={() => setIsPublishOpen(false)}
        onSuccess={() => {
          setIsPublishOpen(false);
          loadData(true);
        }}
      />
    </>
  );
}
