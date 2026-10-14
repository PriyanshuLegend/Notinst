'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Grid3x3, Film, Tag, Copy, Play } from 'lucide-react';
import type { FullProfile, Post } from '@/lib/types';
import { formatCount, formatDuration } from '@/lib/utils';
import PostDetailModal from '@/components/feed/PostDetailModal';

type Tab = 'posts' | 'reels' | 'tagged';

interface PostsGridProps {
  profile: FullProfile;
}

export default function PostsGrid({ profile }: PostsGridProps) {
  const [tab, setTab] = useState<Tab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const tabs: { id: Tab; Icon: React.ElementType; label: string }[] = [
    { id: 'posts', Icon: Grid3x3, label: 'Posts' },
    { id: 'reels', Icon: Film, label: 'Reels' },
    { id: 'tagged', Icon: Tag, label: 'Tagged' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ id, Icon, label }) => (
          <button
            key={id}
            id={`profile-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors
              ${tab === id
                ? 'text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white -mb-px'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={1.8} />
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {tab === 'posts' && (
        <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800">
          {profile.posts.map((post) => (
            <button
              key={post.id}
              id={`profile-post-${post.id}`}
              onClick={() =>
                setSelectedPost({
                  id: post.id,
                  userId: profile.id,
                  user: profile,
                  media: [
                    {
                      id: `${post.id}-media`,
                      url: post.thumbnailUrl,
                      type: post.mediaType,
                    },
                  ],
                  caption: '',
                  likesCount: post.likesCount,
                  commentsCount: post.commentsCount,
                  createdAt: new Date().toISOString(),
                  isLiked: false,
                  isSaved: false,
                  previewComments: [],
                })
              }
              className="relative aspect-square overflow-hidden group cursor-pointer"
              aria-label={`Post with ${formatCount(post.likesCount)} likes`}
            >
              <Image
                src={post.thumbnailUrl}
                alt="Post"
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {post.isMultipleMedia && (
                <span className="absolute top-1.5 right-1.5 text-white drop-shadow-md">
                  <Copy size={14} />
                </span>
              )}
              {post.mediaType === 'video' && (
                <span className="absolute top-1.5 right-1.5 text-white drop-shadow-md">
                  <Play size={14} fill="white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Reels grid */}
      {tab === 'reels' && (
        <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800">
          {profile.reels.map((reel) => (
            <button
              key={reel.id}
              id={`profile-reel-${reel.id}`}
              onClick={() =>
                setSelectedPost({
                  id: reel.id,
                  userId: profile.id,
                  user: profile,
                  media: [
                    {
                      id: `${reel.id}-media`,
                      url: reel.thumbnailUrl,
                      type: 'video',
                    },
                  ],
                  caption: 'Reel',
                  likesCount: Math.floor(reel.viewsCount / 3),
                  commentsCount: 0,
                  createdAt: new Date().toISOString(),
                  isLiked: false,
                  isSaved: false,
                  previewComments: [],
                })
              }
              className="relative aspect-[9/16] overflow-hidden group cursor-pointer"
              aria-label={`Reel with ${formatCount(reel.viewsCount)} views`}
            >
              <Image
                src={reel.thumbnailUrl}
                alt="Reel"
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {/* Overlay info */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-white text-[11px] font-medium drop-shadow-md">
                  <Play size={12} fill="white" />
                  <span>{formatCount(reel.viewsCount)}</span>
                </div>
                <span className="text-white text-[11px] drop-shadow-md">
                  {formatDuration(reel.duration)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tagged grid */}
      {tab === 'tagged' && (
        <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800">
          {profile.taggedPosts.map((post) => (
            <button
              key={post.id}
              id={`profile-tagged-${post.id}`}
              className="relative aspect-square overflow-hidden group"
              aria-label="Tagged post"
            >
              <Image
                src={post.thumbnailUrl}
                alt="Tagged post"
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Post Detail & Comments Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
