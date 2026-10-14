'use client';

import type { Message } from '@/lib/types';
import { ME } from '@/lib/mockData';
import { formatRelativeTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  showTime?: boolean;
}

export default function MessageBubble({ message, showTime }: MessageBubbleProps) {
  const isMe = message.senderId === ME.id;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
      <div
        className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-[14px] leading-snug
          ${isMe
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-br-md'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'
          }`}
      >
        {message.text}
      </div>
      {showTime && (
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
          {formatRelativeTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}
