# Notinst (InstaFocus) — Distraction-Free Instagram

> A private, distraction-free alternative interface and client-side firewall for Instagram that eliminates Reels, Explore discovery loops, algorithmic recommendations, and sponsored posts while preserving ordinary followed accounts, Stories, DMs, profiles, and search.

---

## 🌟 Key Features

### 1. Focus Web Application (Next.js 16 + React 19)
- **Focus Home**: Minimalist chronological feed from accounts you intentionally follow, followed Stories carousel, and clean "You're all caught up" end-state cards.
- **Direct Messages**: Fully functional inbox conversation threads, unread counters, and real-time chat dialogue.
- **Profile & Content**: User profile view with avatar, handle, bio, follower counters, and interactive 3-column media grid with post detail modals.
- **Publishing Hub**: 2-step direct media publishing (photo & video containers) to connected accounts.
- **Dual-Mode Data Architecture**: Operates with seamless fallback between official Meta Graph API (when connected via OAuth) and realistic deterministic mock data (when disconnected).
- **Diagnostics Console**: Health monitor for long-lived access tokens (60-day expiry), endpoint latency, and permission scopes.

### 2. Notinst Safari Userscript Firewall (`v1.2.1`)
- **Reels Firewall**: Automatically redirects `/reels/` and `/reel/<id>/` routes back to the chronological feed (`/`), hiding navigation tabs and blocking in-page SPA route transitions.
- **Explore Firewall (Search Preserved)**: Blocks the algorithmic discovery grid while explicitly keeping Search (`/explore/search/`, tags, and query parameters) functional.
- **Suggested Content Filter**: Conservatively hides in-feed `"Suggested for you"` and `"Because you follow"` recommendations without hiding normal followed posts.
- **Sponsored Content Filter**: Detects and suppresses official `"Sponsored"` and `"Paid partnership"` advertorials.
- **Clean Mobile UI Alignment**: Normalizes the mobile bottom navigation bar on iPhone, evenly distributing slots and horizontally centering the Messages/DM icon without blank gaps.
- **Live DOM Diagnostics**: In-page modal with real-time inspection of active stylesheets, detected navigation containers, and a visual element highlight test.

### 3. Native iOS Proof-of-Concept (`ios/`)
- Native SwiftUI + WebKit wrapper configured with `WKWebsiteDataStore.default()` for persistent Instagram session retention, built for cross-compilation with `xtool`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PriyanshuLegend/Notinst.git
   cd Notinst
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment (Optional)**:
   Copy the example environment file if you wish to connect to an official Meta Developer App:
   ```bash
   cp .env.example .env.local
   ```
   *Note: If `.env.local` is not supplied, Notinst runs automatically in self-contained **MOCK MODE** with full functionality.*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📱 Safari Userscript Installation on iPhone

1. **Install Userscripts**:
   - Download the free and open-source **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)** extension from the App Store on your iPhone.
2. **Enable Extension**:
   - Open iPhone **Settings** → **Safari** → **Extensions** → **Userscripts** → toggle **ON** and set permissions to **Always Allow** on `instagram.com`.
3. **Install Notinst**:
   - Open Safari and navigate to `http://<your-host>:3000/settings` (or open `http://<your-host>:3000/notinst.user.js` directly).
   - Tap **Install Userscript** and confirm **Save/Install** in the extension prompt.
4. **Enjoy Distraction-Free Instagram**:
   - Navigate to `https://www.instagram.com` in Safari. The floating **🛡️ Notinst** badge will appear above the bottom navigation bar.

---

## 🛡️ Architecture & Platform Disclosures

1. **Same-Origin Browser Security**: A third-party website cannot directly modify or inspect Instagram's web DOM due to browser cross-origin boundaries. Running through Safari's local Userscripts extension executes code safely on your device directly within Instagram's page context.
2. **Meta Graph API Boundaries**: Meta's Graph API does *not* provide an endpoint for retrieving your consumer Following feed or Followed Stories (the legacy Basic Display API was completely retired in December 2024). The Notinst web portal connects to official Business/Creator tools (profile, DMs, publishing), while the Safari Userscript delivers the distraction-free consumer browsing experience.
3. **Zero Credential Harvesting**: Notinst never proxies, logs, or stores your Instagram password, private tokens, or session cookies.

---

## 📄 License

Private personal project. All rights reserved.
