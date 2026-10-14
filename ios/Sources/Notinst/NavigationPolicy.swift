import Foundation

/// Represents the navigation firewall decision for a given URL.
enum NavigationDecision: Equatable {
    case allow
    case block(reason: String, redirectURL: URL?)
}

/// Evaluates and enforces navigation rules to prevent access to Instagram Reels
/// and Explore discovery surfaces while keeping normal posts, video posts,
/// stories, DMs, profiles, search, and login functional.
struct NavigationPolicy {
    /// Safe fallback destination when a blocked destination is intercepted.
    static let homeURL = URL(string: "https://www.instagram.com/")!

    /// Evaluates whether a URL should be allowed or blocked.
    /// Follows a conservative fail-safe strategy: if cannot confidently determine, allow it.
    static func evaluate(url: URL?) -> NavigationDecision {
        guard let url = url else {
            return .allow
        }

        // Allow standard system / internal schemes
        guard let scheme = url.scheme?.lowercased(),
              scheme == "https" || scheme == "http" || scheme == "about" else {
            return .allow
        }

        // If it's an external authentication domain (e.g., Facebook, Apple ID), allow it
        guard let host = url.host?.lowercased() else {
            return .allow
        }

        if !host.contains("instagram.com") {
            // Non-Instagram domains (OAuth, CDN, help pages) are allowed
            return .allow
        }

        let path = url.path.lowercased()
        let query = (url.query ?? "").lowercased()

        // ─── 1. Search Surfaces (Always Allowed) ─────────────────────────
        // Search routes must remain completely functional for finding accounts/tags
        if path.hasPrefix("/explore/search") ||
           path.hasPrefix("/explore/tags") ||
           path.hasPrefix("/explore/locations") ||
           query.contains("query=") ||
           query.contains("q=") ||
           query.contains("search") {
            logAllowedSearch(url: url)
            return .allow
        }

        // ─── 2. Explicitly Allowed Content Surfaces ──────────────────────
        // Regular posts (including ordinary video posts!): /p/<id>/
        if path.hasPrefix("/p/") {
            logAllowedNormalPost(url: url)
            return .allow
        }

        // Stories: /stories/<username>/<id>/
        if path.hasPrefix("/stories/") {
            logAllowed(url: url, label: "STORIES")
            return .allow
        }

        // Direct Messages: /direct/...
        if path.hasPrefix("/direct/") || path == "/direct" {
            logAllowed(url: url, label: "MESSAGES")
            return .allow
        }

        // Accounts / Login / Settings: /accounts/...
        if path.hasPrefix("/accounts/") {
            logAllowed(url: url, label: "ACCOUNTS")
            return .allow
        }

        // Homepage / Root: /
        if path.isEmpty || path == "/" {
            logAllowed(url: url, label: "HOME")
            return .allow
        }

        // ─── 3. Blocked Reels Surfaces ───────────────────────────────────
        // Dedicated Reels feed: /reels/ or /reels
        if path == "/reels" || path.hasPrefix("/reels/") {
            let reason = "Reels feed route detected (\(path))"
            logBlockedReels(url: url, reason: reason)
            return .block(reason: reason, redirectURL: homeURL)
        }

        // Dedicated Reel viewer: /reel/<id>/ or /reel/
        if path == "/reel" || path.hasPrefix("/reel/") {
            let reason = "Individual Reel viewer route detected (\(path))"
            logBlockedReels(url: url, reason: reason)
            return .block(reason: reason, redirectURL: homeURL)
        }

        // ─── 4. Blocked Explore Discovery Grid ───────────────────────────
        // Dedicated Explore recommendation grid (without search parameters)
        if path == "/explore" || path == "/explore/" {
            logBlockedExplore(url: url)
            return .block(reason: "Explore recommendation grid detected", redirectURL: homeURL)
        }

        // ─── 5. Default Fail-Safe (Profiles, Static Assets, etc.) ────────
        // Profile pages (/<username>/) and unknown safe routes
        logAllowed(url: url, label: "SAFE_SURFACE")
        return .allow
    }

    // ─── Development Debug Logging ───────────────────────────────────────

    private static func logBlockedExplore(url: URL) {
        #if DEBUG
        print("""
        [Notinst] BLOCKED EXPLORE
        URL: \(url.absoluteString)
        """)
        #endif
    }

    private static func logBlockedReels(url: URL, reason: String) {
        #if DEBUG
        print("""
        [Notinst] BLOCKED
        URL: \(url.absoluteString)
        Reason: \(reason)
        """)
        #endif
    }

    private static func logAllowedSearch(url: URL) {
        #if DEBUG
        print("""
        [Notinst] ALLOWED SEARCH
        URL: \(url.absoluteString)
        """)
        #endif
    }

    private static func logAllowedNormalPost(url: URL) {
        #if DEBUG
        print("""
        [Notinst] ALLOWED NORMAL POST
        URL: \(url.absoluteString)
        """)
        #endif
    }

    private static func logAllowed(url: URL, label: String) {
        #if DEBUG
        print("""
        [Notinst] ALLOWED \(label)
        URL: \(url.absoluteString)
        """)
        #endif
    }
}
