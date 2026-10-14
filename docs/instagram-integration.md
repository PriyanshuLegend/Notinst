# Notinst — Instagram Integration Guide

This guide documents the architecture, OAuth flow, permissions, endpoints, and connected features implemented in Notinst for integrating with official Meta / Instagram APIs.

---

## 1. API Products Used

Notinst uses the **Instagram API with Instagram Login** (and Instagram Graph API v22.0) targeted for **Instagram Professional accounts (Creator & Business)**.

- **Primary Authentication**: Instagram Login for Business (OAuth 2.0 authorization code grant).
- **Core Graph API Host**: `https://graph.instagram.com` (with fallback to `https://graph.facebook.com/v22.0` for linked page messaging).
- **Deprecated APIs Avoided**: Instagram Basic Display API (shut down Dec 2024) and legacy `business_basic` scopes (deprecated Jan 2025).

---

## 2. Connected Features (Phase 3)

The following real features are connected to the UI through the data access layer:

1. **Profile ([src/app/profile/page.tsx](file:///c:/ShitsToDone/Notinst/src/app/profile/page.tsx))**:
   - Live profile photo, username, display name, account type (`CREATOR` / `BUSINESS`), and media count.
   - Fallback to mock data with a "Connect Instagram" callout when unauthenticated.
2. **Posts & Reels Grid ([src/components/profile/PostsGrid.tsx](file:///c:/ShitsToDone/Notinst/src/components/profile/PostsGrid.tsx))**:
   - 3-column media grid populated from `InstagramClient.getMedia()`.
   - Separate tabs for Posts and Reels.
3. **Post Details & Live Comments ([src/components/feed/PostDetailModal.tsx](file:///c:/ShitsToDone/Notinst/src/components/feed/PostDetailModal.tsx))**:
   - Clicking any post or reel thumbnail opens the detail modal.
   - Fetches live comments via `getComments()`.
   - Allows posting new comments directly to Instagram via `postComment()`.
4. **Direct Messages ([src/app/messages/page.tsx](file:///c:/ShitsToDone/Notinst/src/app/messages/page.tsx))**:
   - Lists conversations and messages via `getConversations()`.
   - Optimistic message sending with `sendMessage()`.
   - Displays clear policy explanations when Meta messaging restrictions apply (e.g. 24-hr customer service window).
5. **Content Publishing ([src/components/publishing/PublishModal.tsx](file:///c:/ShitsToDone/Notinst/src/components/publishing/PublishModal.tsx))**:
   - Dedicated modal accessible from Home or Profile to publish Photos or Reels.
   - Uses the official two-step container flow: `createMediaContainer()` followed by `publishMedia()`.
   - Clearly enforces the requirement for a public HTTPS/HTTP media URL (as Meta's servers fetch the asset directly).
6. **Focus Home ([src/app/home/page.tsx](file:///c:/ShitsToDone/Notinst/src/app/home/page.tsx))**:
   - Replaced generic dashboard with an intentional Focus Home showcasing your latest published activity, quick action buttons (New Post, New Reel, Messages, Profile), and distraction-free "You're all caught up" card.

---

## 3. Connection State Architecture

The application cleanly supports three connection states:

```typescript
type ConnectionState = 'NOT_CONNECTED' | 'CONNECTED' | 'CONNECTION_ERROR';
```

- **`NOT_CONNECTED`**: Visual `MOCK MODE` pill. Uses deterministic mock data. Clicking the badge opens `/diagnostics` with "Connect Instagram".
- **`CONNECTED`**: Visual `INSTAGRAM CONNECTED` badge with green pulsing dot and username (`@username`). All queries populate from the live Instagram API.
- **`CONNECTION_ERROR`**: Preserves previous data where possible, shows an inline notice, and prevents crashes.

---

## 4. Architectural Separation

Strict three-tier separation is enforced:

```text
UI Layer (Client Components)
   │ (calls methods from @/lib/api)
   ▼
src/lib/api.ts (Data Access Layer + In-Memory Client Cache)
   │ (queries server-side route handlers /api/instagram/*)
   ▼
src/lib/instagram/ (Server-Side InstagramClient + OAuth + TTL Cache)
   │ (authenticates using httpOnly cookie session)
   ▼
Meta Instagram Graph API (Official Endpoints)
```

UI components never import `InstagramClient` directly or handle raw tokens.

---

## 5. Token Handling & Security Approach

- **Zero Client-Side Exposure**: Access tokens and client secrets are strictly handled in server-side Next.js route handlers (`src/app/api/auth/...`) and server components. Client components never receive raw tokens.
- **Long-Lived Tokens**: Automatically exchanged for 60-day tokens.
- **Tamper-Resistant Storage**: Stored in a base64-encoded `httpOnly` cookie (`notinst_ig_session`) with `SameSite=Lax`, `Path=/`, and `Secure` in production.

---

## 6. Official Permission Scopes (2025/2026 Standards)

| Permission Scope | Purpose |
| :--- | :--- |
| `instagram_business_basic` | Read profile info, media list, individual media details, and Reels. |
| `instagram_business_content_publish` | Create media containers and publish photos/videos/Reels. |
| `instagram_business_manage_comments` | Read comments on own media, reply to comments, hide/unhide comments. |
| `instagram_business_manage_messages` | Read direct conversations, send 1:1 messages within 24h window. |

---

## 7. Unsupported Features & Technical Limitations

1. **No Following Timeline Feed**:
   - Meta provides no endpoint to read posts of accounts you follow.
   - Any app attempting to scrape or use private mobile endpoints risks account termination.
2. **No Followed Stories**:
   - Only your own stories can be read via `/me/stories`. Followed accounts' stories are not accessible.
3. **Messaging Constraints**:
   - 1:1 direct conversations only (no group chats).
   - 24-hour response window for replies to external users.
4. **Publishing Constraints**:
   - Must use public image/video URLs accessible to Meta's servers.

---

## 8. Recommendations for Phase 4

1. **Persistent Local Database (SQLite or IndexedDB)**:
   - Persist fetched media, comments, and conversation archives locally for instant offline loading and search.
2. **Automated Asset Hosting / Staging Tunnel**:
   - Add a lightweight asset upload helper (e.g., using Cloudinary, S3 presigned URLs, or local ngrok tunnel) to automatically stage local media files to a public URL for the Content Publishing API.
3. **Comment Moderation Filters**:
   - Add auto-hide or keyword filter rules for comments on your posts.
