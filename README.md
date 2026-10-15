# Notinst — Distraction-Free Instagram Safari Firewall

> A client-side firewall and distraction-free userscript for Instagram on mobile Safari (iPhone) that eliminates Reels, Explore discovery loops, algorithmic recommendations, and sponsored ads while preserving ordinary followed accounts, Stories, Direct Messages, profiles, and search.

---

## 🌟 Key Features

### Notinst Safari Userscript Firewall (`v1.2.4`)
- **3-Icon Focused Navigation**: Re-spaces Instagram's mobile bottom navigation into exactly three balanced, symmetrical tabs: **Home**, **Direct Messages**, and **Profile**.
- **Reels Firewall**: Automatically intercepts and redirects `/reels/` and `/reel/<id>/` routes back to the chronological feed (`/`), hiding navigation tabs and blocking in-page SPA route transitions.
- **Explore Firewall (Search Preserved)**: Blocks the algorithmic discovery grid while explicitly keeping Search (`/explore/search/`, tags, and query parameters) fully functional.
- **Suggested Content Filter**: Conservatively hides in-feed `"Suggested for you"` and `"Because you follow"` recommendations without hiding normal followed posts.
- **Sponsored Content Filter**: Detects and suppresses official `"Sponsored"` and `"Paid partnership"` advertorials.
- **Stories & Direct Messages Safe**: Explicitly protects the Stories tray (preventing horizontal swiping from shifting the feed) and leaves Direct Messages completely untouched.
- **Live In-Modal DOM Diagnostics**: Real-time diagnostic panel directly on Instagram via the floating `🛡️ Notinst` shield.

---

## 📱 Quick iPhone Safari Installation

1. **Install Userscripts**:
   - Download the free and open-source **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)** extension from the App Store on your iPhone.
2. **Enable Extension in Safari**:
   - Open iPhone **Settings** → **Safari** → **Extensions** → **Userscripts** → toggle **ON** and set permissions to **Always Allow** on `instagram.com`.
3. **Install Notinst Script**:
   - Open Safari on your iPhone and visit your deployed Notinst website (or `/notinst.user.js`).
   - Tap **Install Userscript** and tap **Save/Install** in the extension prompt.
4. **Browse Distraction-Free**:
   - Navigate to `https://www.instagram.com` in Safari. The floating **🛡️ Notinst** badge will appear, and the clean 3-icon navigation will be active.

---

## 🚀 Hosting the Distribution Hub (Next.js)

The repository includes a lightweight Next.js application that hosts the userscript and provides an interactive setup walkthrough.

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm

### Development & Production
```bash
# Install dependencies
npm install

# Start local server
npm run dev

# Build for production (Vercel ready)
npm run build
npm run start
```

---

## 🛡️ Architecture & Privacy Disclosures

1. **Client-Side Execution**: Running through Safari's local Userscripts extension executes code safely on your device directly within Instagram's page context.
2. **Zero Credential Harvesting**: Notinst never proxies, logs, or stores your Instagram password, private tokens, or session cookies.
3. **PWA / "Add to Home Screen" Note**: Apple intentionally disables all Safari Web Extensions inside standalone Home Screen PWAs. To get a 1-tap Home Screen experience, create an iOS Shortcut with the **Open URL** action targeting `https://www.instagram.com/` and add that shortcut to your Home Screen.
