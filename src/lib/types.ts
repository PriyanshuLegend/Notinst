// ─── User / Account ────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  isPrivate?: boolean;
}

// ─── Stories ───────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  user: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string; // ISO string
  expiresAt: string;
  seen: boolean;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnseen: boolean;
}

// ─── Posts ─────────────────────────────────────────────────────────────────

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  altText?: string;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  createdAt: string;
  likesCount: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  media: PostMedia[];
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  location?: string;
  previewComments: Comment[];
}

// ─── Messages / DMs ────────────────────────────────────────────────────────

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: MessageStatus;
  replyToId?: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
  isGroup?: boolean;
  groupName?: string;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export interface ProfilePost {
  id: string;
  thumbnailUrl: string;
  likesCount: number;
  commentsCount: number;
  mediaType: 'image' | 'video';
  isMultipleMedia?: boolean;
}

export interface ProfileReel {
  id: string;
  thumbnailUrl: string;
  viewsCount: number;
  duration: number; // seconds
}

export interface FullProfile extends User {
  posts: ProfilePost[];
  reels: ProfileReel[];
  taggedPosts: ProfilePost[];
}

// ─── Connection State ───────────────────────────────────────────────────────

export type ConnectionState = 'NOT_CONNECTED' | 'CONNECTED' | 'CONNECTION_ERROR';

export interface ConnectionInfo {
  state: ConnectionState;
  username?: string;
  userId?: string;
  accountType?: string;
  avatarUrl?: string;
  error?: string | null;
}

