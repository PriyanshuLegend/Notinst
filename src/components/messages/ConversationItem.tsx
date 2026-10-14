'use client';

import Image from 'next/image';
import { Check, CheckCheck } from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { ME } from '@/lib/mockData';

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const other = conversation.participants[0];
  const lastMsg = conversation.lastMessage;
  const isFromMe = lastMsg?.senderId === ME.id;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      id={`conversation-${conversation.id}`}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${isActive
          ? 'bg-zinc-100 dark:bg-zinc-900'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60 active:bg-zinc-100 dark:active:bg-zinc-900'
        }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={other.avatarUrl}
            alt={other.username}
            width={48}
            height={48}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        {hasUnread && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-950" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[14px] truncate ${hasUnread ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
            {other.username}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            {lastMsg ? formatRelativeTime(lastMsg.createdAt) : ''}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isFromMe && lastMsg && (
            lastMsg.status === 'seen'
              ? <CheckCheck size={13} className="text-blue-500 flex-shrink-0" />
              : <Check size={13} className="text-zinc-400 flex-shrink-0" />
          )}
          <p className={`text-[13px] truncate ${hasUnread ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {isFromMe ? '' : ''}{lastMsg?.text ?? 'No messages yet'}
          </p>
          {hasUnread && (
            <span className="ml-auto flex-shrink-0 w-5 h-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold rounded-full flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
