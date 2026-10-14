'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, AlertCircle, Info } from 'lucide-react';
import type { Conversation, Message } from '@/lib/types';
import { ME } from '@/lib/mockData';
import { sendMessage } from '@/lib/api';
import MessageBubble from './MessageBubble';

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  onBack: () => void;
}

export default function ChatView({ conversation, messages, onBack }: ChatViewProps) {
  const other = conversation.participants[0];
  const [messageList, setMessageList] = useState<Message[]>(messages);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setRestrictionNotice(null);

    const tempId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: ME.id,
      text,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // Optimistic addition
    setMessageList((prev) => [...prev, newMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendMessage({
        conversationId: conversation.id,
        recipientId: other.id,
        text,
      });

      if (!res.success) {
        setRestrictionNotice(res.error || 'Failed to deliver message via Instagram API.');
      } else if (res.message) {
        setMessageList((prev) =>
          prev.map((m) => (m.id === tempId ? res.message! : m))
        );
      }
    } catch (err: unknown) {
      setRestrictionNotice(
        err instanceof Error ? err.message : 'Error transmitting message via Messenger API.'
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <button
          id="chat-back-btn"
          onClick={onBack}
          className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white p-1 -ml-1 rounded-full transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800">
          <Image
            src={other.avatarUrl}
            alt={other.username}
            width={36}
            height={36}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-white truncate">
            {other.username}
          </p>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 truncate">
            {other.displayName}
          </p>
        </div>
      </div>

      {/* Meta Messaging Policy Info Tip */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <Info size={13} className="flex-shrink-0" />
        <span>Official Messenger API: 24-hr customer service window applies to direct replies.</span>
      </div>

      {/* Messages Scroll Area */}
      <div
        id={`chat-messages-${conversation.id}`}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
      >
        {messageList.map((msg, i) => {
          const isLast = i === messageList.length - 1;
          const nextMsg = messageList[i + 1];
          const showTime = isLast || (nextMsg && nextMsg.senderId !== msg.senderId);
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showTime={showTime}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Restriction Notice */}
      {restrictionNotice && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[12px] text-amber-700 dark:text-amber-300">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{restrictionNotice}</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <input
          ref={inputRef}
          id={`chat-input-${conversation.id}`}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-full px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
          aria-label="Message input"
        />
        <button
          id={`chat-send-${conversation.id}`}
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-30 transition-all active:scale-95"
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
