import {
  User,
  Story,
  StoryGroup,
  Post,
  Comment,
  Conversation,
  Message,
  FullProfile,
} from './types';

// Fixed reference time so server and client render identical timestamps.
// This prevents hydration mismatches. Update this when you want "fresh" mock data.
const NOW = new Date('2026-10-05T10:00:00.000Z').getTime();
const ago = (minutes: number) => new Date(NOW - minutes * 60 * 1000).toISOString();

// ─── Mock Users ─────────────────────────────────────────────────────────────

export const ME: User = {
  id: 'me',
  username: 'priyanshu',
  displayName: 'Priyanshu',
  avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=priyanshu&backgroundColor=b6e3f4',
  bio: 'Building things quietly. ✦',
  followersCount: 412,
  followingCount: 138,
  postsCount: 47,
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'leila.m',
    displayName: 'Leila M.',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=leila&backgroundColor=ffdfbf',
    bio: 'Photographer & traveler 📷',
    followersCount: 8420,
    followingCount: 312,
    postsCount: 214,
  },
  {
    id: 'u2',
    username: 'tariq.codes',
    displayName: 'Tariq',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=tariq&backgroundColor=c0aede',
    bio: 'Software engineer. Open source.',
    followersCount: 3100,
    followingCount: 89,
    postsCount: 55,
  },
  {
    id: 'u3',
    username: 'nina.design',
    displayName: 'Nina',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=nina&backgroundColor=d1f0d1',
    bio: 'UI/UX designer 🎨',
    followersCount: 14800,
    followingCount: 441,
    postsCount: 382,
  },
  {
    id: 'u4',
    username: 'james.w',
    displayName: 'James W.',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=james&backgroundColor=ffd5dc',
    bio: 'Coffee connoisseur ☕️',
    followersCount: 2200,
    followingCount: 560,
    postsCount: 98,
  },
  {
    id: 'u5',
    username: 'asel.k',
    displayName: 'Asel K.',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=asel&backgroundColor=b6e3f4',
    bio: 'Mountains & mindfulness 🏔',
    followersCount: 5900,
    followingCount: 210,
    postsCount: 131,
  },
  {
    id: 'u6',
    username: 'marcos.v',
    displayName: 'Marcos V.',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=marcos&backgroundColor=ffeaa7',
    bio: 'Street photography.',
    followersCount: 19200,
    followingCount: 77,
    postsCount: 503,
  },
];

// ─── Mock Stories ────────────────────────────────────────────────────────────

const storyImageSeeds = [
  'https://picsum.photos/seed/story1/400/700',
  'https://picsum.photos/seed/story2/400/700',
  'https://picsum.photos/seed/story3/400/700',
  'https://picsum.photos/seed/story4/400/700',
  'https://picsum.photos/seed/story5/400/700',
  'https://picsum.photos/seed/story6/400/700',
];

export const MOCK_STORY_GROUPS: StoryGroup[] = MOCK_USERS.map((user, i) => {
  const story: Story = {
    id: `story-${user.id}`,
    userId: user.id,
    user,
    mediaUrl: storyImageSeeds[i],
    mediaType: 'image',
    createdAt: ago(i * 90),
    expiresAt: new Date(NOW + (24 - i * 1.5) * 60 * 60 * 1000).toISOString(),
    seen: i > 2,
  };
  return {
    user,
    stories: [story],
    hasUnseen: !story.seen,
  };
});

// ─── Mock Comments ────────────────────────────────────────────────────────────

const makeComment = (id: string, user: User, text: string, minutesAgo: number): Comment => ({
  id,
  userId: user.id,
  user,
  text,
  createdAt: ago(minutesAgo),
  likesCount: (text.length * 3 + minutesAgo) % 35 + 2,
});

// ─── Mock Posts ────────────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    user: MOCK_USERS[0],
    media: [
      { id: 'p1m1', url: 'https://picsum.photos/seed/post1/800/800', type: 'image', altText: 'Mountain sunrise' },
    ],
    caption: 'Golden hour hits different at 3,400m. ✨ No filter needed when the world paints itself.',
    likesCount: 1247,
    commentsCount: 38,
    createdAt: ago(120),
    isLiked: false,
    isSaved: false,
    location: 'Chamonix, France',
    previewComments: [
      makeComment('c1', MOCK_USERS[2], 'Absolutely stunning 😍', 90),
      makeComment('c2', MOCK_USERS[4], 'I need to go here!', 45),
    ],
  },
  {
    id: 'p2',
    userId: 'u2',
    user: MOCK_USERS[1],
    media: [
      { id: 'p2m1', url: 'https://picsum.photos/seed/post2/800/800', type: 'image', altText: 'Code editor setup' },
    ],
    caption: "Finally shipped the new parser. Six weeks of quiet work, and it's 4\u00d7 faster. The boring parts matter.",
    likesCount: 892,
    commentsCount: 61,
    createdAt: ago(300),
    isLiked: true,
    isSaved: true,
    previewComments: [
      makeComment('c3', MOCK_USERS[0], 'Love seeing the behind-the-scenes 👏', 200),
    ],
  },
  {
    id: 'p3',
    userId: 'u3',
    user: MOCK_USERS[2],
    media: [
      { id: 'p3m1', url: 'https://picsum.photos/seed/post3/800/800', type: 'image', altText: 'Design wireframes' },
      { id: 'p3m2', url: 'https://picsum.photos/seed/post3b/800/800', type: 'image', altText: 'Final mockup' },
    ],
    caption: 'From messy wireframes to final pixel — sharing the full design process for this one. Swipe →',
    likesCount: 3421,
    commentsCount: 112,
    createdAt: ago(480),
    isLiked: false,
    isSaved: true,
    previewComments: [
      makeComment('c4', MOCK_USERS[1], 'The progression is incredible 🔥', 300),
      makeComment('c5', MOCK_USERS[5], 'Could you share your process?', 150),
    ],
  },
  {
    id: 'p4',
    userId: 'u4',
    user: MOCK_USERS[3],
    media: [
      { id: 'p4m1', url: 'https://picsum.photos/seed/post4/800/800', type: 'image', altText: 'Latte art' },
    ],
    caption: 'Perfect morning ritual. The ritual matters as much as the result.',
    likesCount: 744,
    commentsCount: 22,
    createdAt: ago(840),
    isLiked: true,
    isSaved: false,
    location: 'Monmouth Coffee, London',
    previewComments: [
      makeComment('c6', MOCK_USERS[4], '☕️☕️☕️', 600),
    ],
  },
  {
    id: 'p5',
    userId: 'u5',
    user: MOCK_USERS[4],
    media: [
      { id: 'p5m1', url: 'https://picsum.photos/seed/post5/800/800', type: 'image', altText: 'Alpine lake' },
    ],
    caption: 'Three days of silence in the mountains. No signal, no notifications — just the sound of wind and water.',
    likesCount: 2108,
    commentsCount: 74,
    createdAt: ago(1320),
    isLiked: false,
    isSaved: true,
    location: 'Kyrgyzstan',
    previewComments: [
      makeComment('c7', MOCK_USERS[0], 'This is the dream 🏔', 1200),
      makeComment('c8', MOCK_USERS[3], 'Wow. When did you go?', 900),
    ],
  },
  {
    id: 'p6',
    userId: 'u6',
    user: MOCK_USERS[5],
    media: [
      { id: 'p6m1', url: 'https://picsum.photos/seed/post6/800/800', type: 'image', altText: 'Street photography' },
    ],
    caption: "Sometimes the best shots are the ones you weren't looking for.",
    likesCount: 4890,
    commentsCount: 203,
    createdAt: ago(1800),
    isLiked: false,
    isSaved: false,
    location: 'Tokyo, Japan',
    previewComments: [
      makeComment('c9', MOCK_USERS[2], 'Masterful timing 👁', 1800),
    ],
  },
];

// ─── Mock Messages ────────────────────────────────────────────────────────────

const makeMsg = (
  id: string,
  conversationId: string,
  senderId: string,
  text: string,
  minutesAgo: number,
): Message => ({
  id,
  conversationId,
  senderId,
  text,
  createdAt: ago(minutesAgo),
  status: 'seen',
});

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participants: [MOCK_USERS[0]],
    lastMessage: makeMsg('m1-last', 'conv1', 'u1', "That sounds amazing! Let me know when you're free \uD83D\uDE0A", 5),
    unreadCount: 2,
    updatedAt: ago(5),
  },
  {
    id: 'conv2',
    participants: [MOCK_USERS[1]],
    lastMessage: makeMsg('m2-last', 'conv2', 'me', 'Pushed the fix. Should be working now 🔧', 40),
    unreadCount: 0,
    updatedAt: ago(40),
  },
  {
    id: 'conv3',
    participants: [MOCK_USERS[2]],
    lastMessage: makeMsg('m3-last', 'conv3', 'u3', 'Loved your latest post btw ✨', 120),
    unreadCount: 1,
    updatedAt: ago(120),
  },
  {
    id: 'conv4',
    participants: [MOCK_USERS[3]],
    lastMessage: makeMsg('m4-last', 'conv4', 'u4', 'Come visit the cafe sometime!', 300),
    unreadCount: 0,
    updatedAt: ago(300),
  },
  {
    id: 'conv5',
    participants: [MOCK_USERS[4]],
    lastMessage: makeMsg('m5-last', 'conv5', 'me', 'Those mountains look unreal 🏔', 720),
    unreadCount: 0,
    updatedAt: ago(720),
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  conv1: [
    makeMsg('m1-1', 'conv1', 'u1', 'Hey! Saw your latest photo — where was that?', 32),
    makeMsg('m1-2', 'conv1', 'me', 'Chamonix! Just got back last week 🏔', 28),
    makeMsg('m1-3', 'conv1', 'u1', 'Oh wow. How was it?', 25),
    makeMsg('m1-4', 'conv1', 'me', 'Absolutely incredible. Highly recommend.', 20),
    makeMsg('m1-5', 'conv1', 'u1', 'I have been meaning to go for years', 15),
    makeMsg('m1-6', 'conv1', 'u1', "That sounds amazing! Let me know when you're free \uD83D\uDE0A", 5),
  ],
  conv2: [
    makeMsg('m2-1', 'conv2', 'u2', 'Hey, did you see the issue I filed on GitHub?', 120),
    makeMsg('m2-2', 'conv2', 'me', 'Yeah, looking into it now', 100),
    makeMsg('m2-3', 'conv2', 'u2', 'The null check on line 47 is the culprit I think', 90),
    makeMsg('m2-4', 'conv2', 'me', 'You are right! Great catch', 70),
    makeMsg('m2-5', 'conv2', 'me', 'Pushed the fix. Should be working now 🔧', 40),
  ],
  conv3: [
    makeMsg('m3-1', 'conv3', 'u3', 'Hi! Loving your photography style', 480),
    makeMsg('m3-2', 'conv3', 'me', 'Thank you so much! I really admire your design work', 460),
    makeMsg('m3-3', 'conv3', 'u3', 'We should collaborate on something sometime', 440),
    makeMsg('m3-4', 'conv3', 'me', 'Definitely! I have been thinking the same', 420),
    makeMsg('m3-5', 'conv3', 'u3', 'Loved your latest post btw ✨', 120),
  ],
  conv4: [
    makeMsg('m4-1', 'conv4', 'u4', 'Hey, the single origin you recommended is fantastic', 600),
    makeMsg('m4-2', 'conv4', 'me', 'Right?! I knew you would like it', 580),
    makeMsg('m4-3', 'conv4', 'u4', 'Come visit the cafe sometime!', 300),
  ],
  conv5: [
    makeMsg('m5-1', 'conv5', 'u5', 'Just got back from Kyrgyzstan', 1440),
    makeMsg('m5-2', 'conv5', 'me', 'Those mountains look unreal 🏔', 720),
  ],
};

// ─── Mock Full Profile ─────────────────────────────────────────────────────

export const MOCK_PROFILE: FullProfile = {
  ...ME,
  posts: Array.from({ length: 12 }, (_, i) => ({
    id: `pp${i}`,
    thumbnailUrl: `https://picsum.photos/seed/prof${i}/300/300`,
    likesCount: (i * 173 + 120) % 950 + 45,
    commentsCount: (i * 17 + 8) % 75 + 2,
    mediaType: i % 5 === 0 ? 'video' : 'image',
    isMultipleMedia: i % 4 === 0,
  })),
  reels: Array.from({ length: 6 }, (_, i) => ({
    id: `pr${i}`,
    thumbnailUrl: `https://picsum.photos/seed/reel${i}/300/400`,
    viewsCount: (i * 1420 + 2300) % 12000 + 500,
    duration: ((i * 7 + 15) % 45) + 10,
  })),
  taggedPosts: Array.from({ length: 8 }, (_, i) => ({
    id: `pt${i}`,
    thumbnailUrl: `https://picsum.photos/seed/tagged${i}/300/300`,
    likesCount: (i * 89 + 60) % 480 + 20,
    commentsCount: (i * 9 + 4) % 28 + 1,
    mediaType: 'image',
  })),
};
