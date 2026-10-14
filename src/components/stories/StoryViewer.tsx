'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StoryGroup } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const totalStories = currentGroup?.stories.length ?? 0;

  const goNext = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, totalStories, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(0);
      setProgress(0);
    }
  }, [storyIndex, groupIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          goNext();
          return 0;
        }
        return p + 100 / (STORY_DURATION_MS / 100);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [groupIndex, storyIndex, paused, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
    >
      {/* Story container — iPhone proportioned */}
      <div
        className="relative w-full max-w-sm h-full max-h-[812px] overflow-hidden select-none"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
      >

        {/* Background image */}
        <Image
          src={currentStory.mediaUrl}
          alt={`${currentGroup.user.username}'s story`}
          fill
          className="object-cover"
          unoptimized
          priority
        />

        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[2px] rounded-full bg-white/40 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-0 right-0 flex items-center gap-3 px-4 z-10">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/80">
            <Image
              src={currentGroup.user.avatarUrl}
              alt={currentGroup.user.username}
              width={32}
              height={32}
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none truncate">
              {currentGroup.user.username}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              {formatRelativeTime(currentStory.createdAt)}
            </p>
          </div>
          <button
            id="story-close-btn"
            onClick={onClose}
            className="text-white/90 hover:text-white p-1 -mr-1 transition-colors"
            aria-label="Close story viewer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tap zones */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-10"
          onPointerDown={goPrev}
          aria-label="Previous story"
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-10"
          onPointerDown={goNext}
          aria-label="Next story"
        />

        {/* Desktop navigation arrows */}
        <button
          id="story-prev-btn"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white
                     bg-black/30 hover:bg-black/50 rounded-full p-1.5 transition-all
                     hidden sm:flex"
          aria-label="Previous story"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          id="story-next-btn"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white
                     bg-black/30 hover:bg-black/50 rounded-full p-1.5 transition-all
                     hidden sm:flex"
          aria-label="Next story"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
