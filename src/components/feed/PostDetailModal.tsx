'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Post, Comment } from '@/lib/types';
import { formatCount, formatRelativeTime } from '@/lib/utils';
import { getMediaComments, postComment } from '@/lib/api';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
}: PostDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [prevPostId, setPrevPostId] = useState<string | null>(null);

  if (post && post.id !== prevPostId) {
    setPrevPostId(post.id);
    setLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setComments(post.previewComments || []);
    setLoadingComments(true);
    setError(null);
  }

  useEffect(() => {
    if (!post || !isOpen) return;

    let active = true;
    getMediaComments(post.id)
      .then((data) => {
        if (active) {
          if (data && data.length > 0) {
            setComments(data);
          }
          setLoadingComments(false);
        }
      })
      .catch(() => {
        if (active) setLoadingComments(false);
      });

    return () => {
      active = false;
    };
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleLike = () => {
    setLiked((prev) => {
      setLikesCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    const commentText = newCommentText.trim();
    setNewCommentText('');
    setIsSubmitting(true);
    setError(null);

    // Optimistic comment
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      userId: 'me',
      user: {
        id: 'me',
        username: 'you',
        displayName: 'You',
        avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=priyanshu&backgroundColor=b6e3f4',
        bio: '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      },
      text: commentText,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    setComments((prev) => [tempComment, ...prev]);

    try {
      const res = await postComment(post.id, commentText);
      if (!res.success) {
        setError(res.error || 'Failed to submit comment.');
      } else if (res.comment) {
        // replace temp with real comment
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? res.comment! : c))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMedia = post.media[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 flex-shrink-0">
              <Image
                src={post.user.avatarUrl}
                alt={post.user.username}
                width={32}
                height={32}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-white leading-tight">
                {post.user.username}
              </p>
              <p className="text-[11px] text-zinc-400">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Media */}
          {currentMedia && (
            <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center">
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={currentMedia.url}
                  alt={post.caption || 'Post image'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`p-1 transition-all active:scale-90 ${
                    liked ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                  aria-label="Like"
                >
                  <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
                </button>
                <div className="flex items-center gap-1 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">
                  <MessageCircle size={20} className="text-zinc-500" />
                  <span>{comments.length}</span>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-zinc-900 dark:text-white">
                {formatCount(likesCount)} likes
              </span>
            </div>

            {/* Caption */}
            {post.caption && (
              <p className="text-[13px] text-zinc-800 dark:text-zinc-200 leading-snug">
                <span className="font-semibold mr-1.5">{post.user.username}</span>
                {post.caption}
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-4 space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Comments {loadingComments && '• Loading...'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[12px] text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingComments ? (
              <div className="py-6 flex items-center justify-center text-zinc-400">
                <Loader2 size={18} className="animate-spin text-purple-600" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-[12px] text-zinc-500 italic py-2">
                No comments yet. Start the conversation.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 flex-shrink-0 mt-0.5">
                      <Image
                        src={c.user.avatarUrl}
                        alt={c.user.username}
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-[13px]">
                      <p className="text-zinc-900 dark:text-white leading-snug">
                        <span className="font-semibold mr-1.5">{c.user.username}</span>
                        {c.text}
                      </p>
                      <span className="text-[11px] text-zinc-400">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Composer */}
        <form
          onSubmit={handleAddComment}
          className="flex items-center gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90"
        >
          <input
            type="text"
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors"
            aria-label="Post comment"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
