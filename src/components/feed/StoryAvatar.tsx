import Image from 'next/image';
import type { StoryGroup } from '@/lib/types';

interface StoryAvatarProps {
  group: StoryGroup;
  size?: number;
  onClick?: () => void;
}

export default function StoryAvatar({ group, size = 60, onClick }: StoryAvatarProps) {
  const ringClass = group.hasUnseen
    ? 'ring-2 ring-offset-2 ring-zinc-800 dark:ring-white ring-offset-white dark:ring-offset-zinc-950'
    : 'ring-2 ring-offset-2 ring-zinc-300 dark:ring-zinc-700 ring-offset-white dark:ring-offset-zinc-950';

  return (
    <button
      id={`story-avatar-${group.user.id}`}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      onClick={onClick}
      aria-label={`${group.user.username}'s story`}
    >
      <div
        className={`rounded-full overflow-hidden transition-opacity active:opacity-70 ${ringClass}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={group.user.avatarUrl}
          alt={group.user.username}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <span
        className={`text-[11px] w-16 text-center truncate leading-none
          ${group.hasUnseen
            ? 'text-zinc-900 dark:text-white font-medium'
            : 'text-zinc-500 dark:text-zinc-400'}`}
      >
        {group.user.username}
      </span>
    </button>
  );
}
