'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Info } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ConversationItem from '@/components/messages/ConversationItem';
import ChatView from '@/components/messages/ChatView';
import ConnectionBadge from '@/components/layout/ConnectionBadge';
import { getConversations, getMessages } from '@/lib/api';
import type { Conversation, Message } from '@/lib/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    getConversations()
      .then((res) => {
        if (mounted) {
          setConversations(res.conversations);
          if (res.restrictionNotice) {
            setRestrictionNotice(res.restrictionNotice);
          }
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

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) ?? null;

  const handleOpenConversation = async (conv: Conversation) => {
    setActiveConvId(conv.id);
    const msgs = await getMessages(conv.id);
    setActiveMessages(msgs);
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.participants.some(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q)
      )
    );
  }, [conversations, searchQuery]);

  // When a conversation is open, show the chat view full-screen within the shell
  if (activeConversation) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto">
        <ChatView
          conversation={activeConversation}
          messages={activeMessages}
          onBack={() => setActiveConvId(null)}
        />
      </div>
    );
  }

  return (
    <AppShell
      header={
        <div className="px-4 py-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[19px] font-bold text-zinc-900 dark:text-white">
              Messages
            </h1>
            <ConnectionBadge />
          </div>
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              id="messages-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search direct messages"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
            />
          </div>
        </div>
      }
    >
      {restrictionNotice && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[12px] text-amber-700 dark:text-amber-300">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{restrictionNotice}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={24} className="animate-spin text-purple-600" />
          <span className="text-[13px]">Loading conversations...</span>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="py-20 px-6 text-center text-zinc-400">
          <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">
            No conversations found
          </p>
          <p className="text-[12px] text-zinc-500 mt-1">
            {searchQuery
              ? 'No matching direct messages for this query.'
              : 'Direct messages sent to your professional account will appear here.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleOpenConversation(conv)}
              className="cursor-pointer"
            >
              <ConversationItem
                conversation={conv}
                onClick={() => handleOpenConversation(conv)}
              />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
