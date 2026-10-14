'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Post } from '@/lib/types';
import { formatRelativeTime, formatCount } from '@/lib/utils';
import PostDetailModal from './PostDetailModal';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasMultipleMedia = post.media.length > 1;
  const currentMedia = post.media[mediaIndex];

  const handleLike = () => {
    setLiked((prev) => {
      setLikesCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const CAPTION_LIMIT = 120;
  const captionTruncated = post.caption.length > CAPTION_LIMIT && !showFullCaption;
  const displayCaption = captionTruncated
    ? post.caption.slice(0, CAPTION_LIMIT) + '…'
    : post.caption;

  return (
    <article className="border-b border-zinc-100 dark:border-zinc-900">
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href="/profile" className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Image
              src={post.user.avatarUrl}
              alt={post.user.username}
              width={36}
              height={36}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link href="/profile">
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-white hover:underline">
                {post.user.username}
              </span>
            </Link>
            {post.user.isVerified && (
              <span className="text-blue-500" aria-label="Verified">✓</span>
            )}
          </div>
          {post.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-zinc-400" />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {post.location}
              </span>
            </div>
          )}
        </div>
        <button
          id={`post-options-${post.id}`}
          className="text-zinc-500 dark:text-zinc-400 p-1 -mr-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label="Post options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media */}
      <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <Image
          src={currentMedia.url}
          alt={currentMedia.altText ?? `Post by ${post.user.username}`}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Multi-media navigation */}
        {hasMultipleMedia && (
          <>
            {mediaIndex > 0 && (
              <button
                id={`post-media-prev-${post.id}`}
                onClick={() => setMediaIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white
                           rounded-full p-1 hover:bg-black/60 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {mediaIndex < post.media.length - 1 && (
              <button
                id={`post-media-next-${post.id}`}
                onClick={() => setMediaIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white
                           rounded-full p-1 hover:bg-black/60 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            )}
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all
                    ${i === mediaIndex ? 'bg-blue-500 w-3' : 'bg-white/70'}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-1">
        <button
          id={`post-like-${post.id}`}
          onClick={handleLike}
          className={`p-1.5 rounded-full transition-all active:scale-90
            ${liked
              ? 'text-red-500'
              : 'text-zinc-800 dark:text-zinc-100 hover:text-zinc-600'}`}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          aria-pressed={liked}
        >
          <Heart size={24} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
        <button
          id={`post-comment-${post.id}`}
          onClick={() => setIsDetailOpen(true)}
          className="p-1.5 text-zinc-800 dark:text-zinc-100 hover:text-zinc-600 transition-colors"
          aria-label="Comment"
        >
          <MessageCircle size={24} strokeWidth={1.8} />
        </button>
        <button
          id={`post-share-${post.id}`}
          className="p-1.5 text-zinc-800 dark:text-zinc-100 hover:text-zinc-600 transition-colors"
          aria-label="Share"
        >
          <Send size={22} strokeWidth={1.8} />
        </button>
        <div className="flex-1" />
        <button
          id={`post-save-${post.id}`}
          onClick={() => setSaved((s) => !s)}
          className={`p-1.5 transition-all active:scale-90
            ${saved
              ? 'text-zinc-900 dark:text-white'
              : 'text-zinc-800 dark:text-zinc-100 hover:text-zinc-600'}`}
          aria-label={saved ? 'Unsave post' : 'Save post'}
          aria-pressed={saved}
        >
          <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-4 pb-1">
        <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">
          {formatCount(likesCount)} likes
        </span>
      </div>

      {/* Caption */}
      <div className="px-4 pb-1">
        <p className="text-[13px] text-zinc-800 dark:text-zinc-200 leading-snug">
          <span className="font-semibold mr-1.5">{post.user.username}</span>
          {displayCaption}
          {captionTruncated && (
            <button
              onClick={() => setShowFullCaption(true)}
              className="text-zinc-400 dark:text-zinc-500 ml-1 hover:text-zinc-600"
            >
              more
            </button>
          )}
        </p>
      </div>

      {/* Preview comments */}
      {post.previewComments.length > 0 && (
        <div className="px-4 pb-1 space-y-0.5">
          {post.commentsCount > post.previewComments.length && (
            <button
              id={`post-view-comments-${post.id}`}
              onClick={() => setIsDetailOpen(true)}
              className="text-[13px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            >
              View all {formatCount(post.commentsCount)} comments
            </button>
          )}
          {post.previewComments.map((comment) => (
            <p key={comment.id} className="text-[13px] text-zinc-800 dark:text-zinc-200 leading-snug">
              <span className="font-semibold mr-1.5">{comment.user.username}</span>
              {comment.text}
            </p>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 pt-1 pb-4">
        <time
          dateTime={post.createdAt}
          className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide"
        >
          {formatRelativeTime(post.createdAt)}
        </time>
      </div>

      {/* Post Detail & Comments Modal */}
      <PostDetailModal
        post={post}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </article>
  );
}
