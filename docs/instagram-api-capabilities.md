# Instagram API Capabilities Analysis for Notinst

This document provides a factual assessment of the current official Meta/Instagram APIs as of 2025/2026 for an **Instagram Professional account (Creator or Business)** and records the connection status in Notinst.

> [!IMPORTANT]
> **Core Principle**: Features are evaluated strictly against what Meta's official Graph APIs allow third-party applications to do. We do not claim features are supported merely because Instagram's first-party mobile app or web interface supports them, nor do we rely on prohibited scraping or undocumented private endpoints.

---

## Capabilities & Implementation Matrix

| Feature | Officially Supported? | API / Permission | Notinst Phase 3 Implementation Status | Notes |
| :--- | :---: | :--- | :---: | :--- |
| **Profile** | **YES** | `instagram_business_basic`<br>`GET /me` | **CONNECTED & TESTED** | Retrieves username, name, account type (`BUSINESS`/`CREATOR`), profile picture URL, and media count. Standard Access allows personal testing without App Review. |
| **Own posts** | **YES** | `instagram_business_basic`<br>`GET /me/media` | **CONNECTED & TESTED** | Populates profile 3-column grid and Home activity feed with media URLs, captions, timestamps, like counts, and comments count. |
| **Own Reels** | **YES** | `instagram_business_basic`<br>`GET /me/media` | **CONNECTED & TESTED** | Reels are filtered via `media_product_type=REELS` or `media_type=VIDEO` and displayed under the Reels profile tab. |
| **Post Details & Comments** | **YES** | `instagram_business_manage_comments`<br>`GET /{media-id}/comments`<br>`POST /{media-id}/comments` | **CONNECTED & TESTED** | Clicking any post opens `PostDetailModal` with real comments and allows posting optimistic new comments directly to Instagram. |
| **Publishing (Photos/Reels)** | **YES** | `instagram_business_content_publish`<br>`POST /{ig-user-id}/media`<br>`POST /{ig-user-id}/media_publish` | **CONNECTED & TESTED** | Implemented via the `PublishModal` using Meta's mandatory two-step container publishing pipeline. **Constraint**: Requires a public HTTP/HTTPS URL (Meta servers fetch assets directly; localhost/blob cannot be ingested). |
| **Direct Messages (1:1 DMs)** | **YES** *(with limitations)* | `instagram_business_manage_messages`<br>`GET /me/conversations`<br>`POST /me/messages` | **CONNECTED & TESTED** | Supported through the Messenger API for Instagram for Professional accounts. **Limitations**: (1) 1:1 direct conversations only (group DMs unsupported); (2) 24-hour response window for sending replies; (3) Inline alert shown if policy prevents delivery. |
| **Following feed** (Timeline from accounts I follow) | ❌ **NO (STRICTLY UNSUPPORTED)** | None (No official endpoint exists) | **UNSUPPORTED BY META** | Meta does not provide any API to retrieve a chronological timeline, home feed, or posts from accounts you follow. Notinst adapts the Home screen into an intentional **Focus Home** showcasing your own latest published activity. |
| **Followed accounts' Stories** | ❌ **NO (STRICTLY UNSUPPORTED)** | None (No official endpoint exists) | **UNSUPPORTED BY META** | The official API provides `GET /{ig-user-id}/stories` exclusively for reading the authenticated user's own active stories. Third-party followed stories cannot be queried. |

---

## Explicitly Excluded Features (Distraction-Free Alignment)

Notinst was conceived as a distraction-free alternative to Instagram. The following features are **explicitly not wanted**:

- **Algorithmic Explore Tab**: ❌ Excluded by design (also unsupported by official API).
- **Infinite Recommended Reels Feed**: ❌ Excluded by design (also unsupported by official API).
- **Suggested Posts & Sponsored Injections**: ❌ Excluded by design (also unsupported by official API).
- **Shopping / Ad Overlays**: ❌ Excluded by design.

---

## Architectural Summary of Connected Features

```text
UI Components (HomePage, ProfilePage, MessagesPage, PostDetailModal, PublishModal)
                                │
                                ▼
                       src/lib/api.ts
                (Data Access Layer with TTL Caching)
                  ├── NOT_CONNECTED  ──►  Deterministic Mock Data (MOCK MODE)
                  └── CONNECTED      ──►  /api/instagram/* Route Handlers
                                                │
                                                ▼
                                   src/lib/instagram/client.ts
                                   (Server-Side InstagramClient)
                                                │
                                                ▼
                                    Meta Instagram Graph API
```
