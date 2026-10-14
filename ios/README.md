# Notinst — iOS Native Proof of Concept (xtool) & Reels Firewall

This directory contains the native iOS application for **Notinst (InstaFocus)**, built using **Swift**, **SwiftUI**, and **WebKit (`WKWebView`)**.

It is structured specifically for cross-platform iOS development on **Windows / WSL2** without macOS or Xcode, using **[xtool](https://xtool.sh)** and Swift Package Manager (SPM).

---

## 🛡️ Reels Firewall Architecture

The core objective of Notinst is to provide normal Instagram functionality while cutting off access to the addictive algorithmic Reels rabbit hole.

### Multi-Layer Defense System

1. **Native Navigation Firewall ([NavigationPolicy.swift](file:///c:/ShitsToDone/Notinst/ios/Sources/Notinst/NavigationPolicy.swift))**:
   - Intercepts requests in `WKNavigationDelegate.decidePolicyFor navigationAction`.
   - Parses the destination URL path:
     - **Blocked**: `/reels/`, `/reels`, `/reel/<id>/`, `/reel/`
     - **Allowed**: `/p/` (all normal posts, photo or video), `/stories/`, `/direct/`, `/accounts/`, `/<username>/`, `/`
   - When a Reels path is detected, the navigation is canceled and safely redirected to `https://www.instagram.com/` without showing a browser error page.
   - Dedicated Explore recommendation grid (`/explore/` or `/explore`) is intercepted and redirected back to Home.
   - **Search Preservation**: Search paths (`/explore/search/`, `/explore/tags/`, query parameters `?q=` / `?query=`) are explicitly **ALLOWED** so users can search for accounts and hashtags.

2. **DOM UI Filtering & MutationObserver ([WebFilters.swift](file:///c:/ShitsToDone/Notinst/ios/Sources/Notinst/WebFilters.swift))**:
   - Injects a `WKUserScript` at `.atDocumentStart`.
   - Injects CSS rules hiding all `a[href*="/reels"]`, `a[href*="/reel/"]`, elements with `aria-label*="Reels"`, and dedicated `a[href="/explore/"]` navigation icons.
   - Uses a `MutationObserver` on `document.documentElement` to continually hide dynamically rendered Reels and Explore navigation elements as React mounts them.

3. **Suggested Posts Filter in Home Feed ([WebFilters.swift](file:///c:/ShitsToDone/Notinst/ios/Sources/Notinst/WebFilters.swift))**:
   - Inspects newly inserted `<article>` containers in the Home feed for algorithmic recommendation signals (`"Suggested for you"`, `"Suggested post"`, `"Because you follow"`, `"Because you liked"`).
   - Hides matching recommendation articles and marks processed nodes with `data-notinst-filtered="true"` to prevent redundant re-scans.
   - **Conservative**: Ordinary followed posts (photo, video, carousels) are untouched.

4. **"You're All Caught Up" Minimalist End-State Card**:
   - When the feed reaches the end of followed posts or begins encountering suggested posts, Notinst injects a clean, non-gamified end-state card:
     ```text
     You're all caught up.
     You've seen everything from the people you follow.
     [Close]
     ```
   - Prevents endless scrolling without showing addictive recommendations.

5. **In-Page SPA Transition & Click Trap ([WebFilters.swift](file:///c:/ShitsToDone/Notinst/ios/Sources/Notinst/WebFilters.swift))**:
   - Intercepts capture-phase click events on any anchor linking to Reels or Explore grids.
   - Hooks `window.history.pushState` and `window.history.replaceState` so client-side SPA route transitions to `/reels/` or `/explore/` are caught and diverted back to Home (`/`).

---

## 📋 Firewall Route Table

| Instagram Surface | Path Pattern | Firewall Status | Reason / Mechanism |
| :--- | :--- | :---: | :--- |
| **Home Feed** | `/` | **ALLOWED** | Primary chronological feed |
| **Normal Post (Photo)** | `/p/<id>/` | **ALLOWED** | Content consumption |
| **Normal Post (Video)** | `/p/<id>/` | **ALLOWED** | Video posts remain functional |
| **Search Subroute** | `/explore/search/`, `?q=...` | **ALLOWED** | Explicitly preserved for finding accounts |
| **Hashtags / Location Search** | `/explore/tags/...` | **ALLOWED** | Content exploration by topic |
| **Stories** | `/stories/<user>/<id>/` | **ALLOWED** | Temporary follower updates |
| **Direct Messages** | `/direct/t/<id>/` | **ALLOWED** | Communication |
| **User Profile** | `/<username>/` | **ALLOWED** | Profile inspection |
| **Account Settings / Login** | `/accounts/...` | **ALLOWED** | Authentication & settings |
| **Reels Tab / Feed** | `/reels/`, `/reels` | 🚫 **BLOCKED** | Addictive short-form video feed |
| **Individual Reel Viewer** | `/reel/<id>/`, `/reel` | 🚫 **BLOCKED** | Infinite algorithmic reel player |
| **Explore Recommendation Grid** | `/explore/`, `/explore` | 🚫 **BLOCKED** | Algorithmic discovery grid (without search params) |
| **Home Suggested Posts** | Feed `<article>` labels | 🚫 **FILTERED** | "Suggested for you" post injections |

---

## 📁 Project Structure

```text
ios/
├── Package.swift                     # Swift Package Manager manifest (iOS 16+)
├── xtool.yml                         # xtool bundle & packaging configuration
├── Info.plist                        # iOS App metadata & security configuration
├── .gitignore                        # Ignores build artifacts and .xtool cache
├── README.md                         # This step-by-step setup and command guide
├── Sources/
│   └── Notinst/
│       ├── NotinstApp.swift          # SwiftUI @main entry point
│       ├── ContentView.swift         # Full-screen dark container & loading indicator
│       ├── InstagramWebView.swift    # Persistent WKWebView with native swipe gestures
│       ├── NavigationPolicy.swift    # Route evaluation, Reels detection & debug logging
│       └── WebFilters.swift          # Script injection, CSS hiding & click interceptors
└── Tests/
    └── NotinstTests/
        └── NavigationPolicyTests.swift # Unit tests for allowed vs. blocked URL patterns
```

---

## 🛠 Prerequisites for Windows / WSL2

To build, sign, and install this app onto your physical iPhone from Windows without macOS:

1. **WSL2 (Ubuntu Recommended)**:
   - Ensure WSL2 is installed: `wsl --status` in Windows PowerShell.
2. **Swift Linux Toolchain**:
   - Swift 5.9+ or 6.0 installed inside your WSL distribution.
3. **xtool CLI**:
   - Install `xtool` inside WSL:
     ```bash
     curl -fsSL https://xtool.sh/install.sh | bash
     ```
   - Verify: `xtool --version`
4. **USB Device Passthrough (Windows to WSL)**:
   - Windows side: Install [usbipd-win](https://github.com/dorssel/usbipd-win) via winget:
     ```powershell
     winget install dorssel.usbipd-win
     ```
   - WSL side: Install `usbmuxd` and `libimobiledevice`:
     ```bash
     sudo apt-get update && sudo apt-get install -y usbmuxd libimobiledevice-utils
     ```

---

## 🚀 Step-by-Step Build & Install Commands

Execute these steps in your terminal (WSL2) from the `ios/` directory:

```bash
cd ios
```

### 1. Set Up the iOS SDK in xtool

If you haven't yet set up the iOS SDK in `xtool`:

```bash
xtool setup
```
Or manage SDKs directly:
```bash
xtool sdk list
```

---

### 2. Authenticate xtool with Apple (Code Signing)

To sign and install an app on your physical iPhone, Apple requires an Apple ID (Free Personal Team or Paid Apple Developer Account).

Run the interactive login command:

```bash
xtool auth login
```

- Enter your Apple ID email and password (or App-Specific Password).
- Follow the two-factor authentication (2FA) prompt.
- **Security Note**: Credentials are handled securely by `xtool`'s local keychain and are **never** committed to git or stored in project files.

---

### 3. Connect and Detect Your Physical iPhone

1. Connect your iPhone via USB cable to your PC and tap **"Trust This Computer"** on the phone.
2. In Windows PowerShell (Administrator), attach the iPhone to WSL using `usbipd-win`:
   ```powershell
   usbipd list
   # Locate the BUSID for your Apple Mobile Device / iPhone, then:
   usbipd bind --busid <BUSID>
   usbipd attach --wsl --busid <BUSID>
   ```
3. Inside your WSL terminal, verify detection:
   ```bash
   xtool devices
   ```
   You should see your connected iPhone listed with its name and UDID.

---

### 4. Build, Sign, and Run the App

With `xtool`, building and deploying to your connected device is streamlined:

```bash
# In the ios/ directory:
xtool dev
```

What `xtool dev` does automatically:
1. Compiles the Swift package via `Package.swift`.
2. Packages the executable into an iOS `.app` bundle using `xtool.yml` and `Info.plist`.
3. Creates a local development provisioning profile with Apple Developer Services.
4. Codesigns the application bundle.
5. Installs the signed `.ipa` onto your connected physical iPhone.
6. Launches **Notinst** on your iPhone.

---

### Alternative: Manual Step-by-Step Commands

```bash
# Step A: Build the package
xtool build

# Step B: Install the built package onto your iPhone
xtool install

# Step C: Launch Notinst on your iPhone
xtool launch com.notinst.ios
```

---

## 🔍 Debug Logging

During development builds (`#if DEBUG`), the firewall outputs structured diagnostic logs:

- **When Explore is blocked**:
  ```text
  [Notinst] BLOCKED EXPLORE
  URL: https://www.instagram.com/explore/
  ```
- **When a suggested post is filtered**:
  ```text
  [Notinst] FILTERED SUGGESTED POST
  Reason: suggested for you
  ```
- **When Search is allowed**:
  ```text
  [Notinst] ALLOWED SEARCH
  URL: https://www.instagram.com/explore/search/
  ```
- **When a normal post is allowed**:
  ```text
  [Notinst] ALLOWED NORMAL POST
  URL: https://www.instagram.com/p/C9xyz012345/
  ```
- **When Reels is blocked**:
  ```text
  [Notinst] BLOCKED
  URL: https://www.instagram.com/reels/
  Reason: Reels feed route detected (/reels/)
  ```

---

## 📱 First-Time Launch on iPhone

When launching a development app signed with a personal Apple ID for the first time:

1. **Enable Developer Mode (iOS 16+)**:
   - Open **Settings** on your iPhone → **Privacy & Security** → tap **Developer Mode** → toggle on and restart.
2. **Trust Developer Certificate**:
   - Open **Settings** on your iPhone → **General** → **VPN & Device Management** → tap your Apple ID under **Developer App** → tap **Trust**.
3. **Open Notinst**:
   - Tap **Notinst** on your home screen.
   - The Reels tab and navigation icons will be completely hidden.
   - Any manual or deep link navigation to Reels will be transparently redirected back to Home.
