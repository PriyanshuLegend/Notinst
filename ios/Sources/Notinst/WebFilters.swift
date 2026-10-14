#if canImport(WebKit)
import WebKit

/// Manages script injection and client-side DOM filtering for Instagram Web
/// to enforce the Notinst distraction firewall:
///  1. Hides Reels and Explore navigation elements
///  2. Filters out "Suggested for you" and algorithmic recommendation posts
///  3. Injects a minimal "You're all caught up" end-state card
///  4. Intercepts in-page SPA navigation attempts toward discovery surfaces
struct WebFilters {
    /// Name of the script message handler for communicating firewall events to native Swift
    static let messageHandlerName = "notinstFirewall"

    /// Generates the WKUserScript injected into all frames at document start.
    static func makeUserScript() -> WKUserScript {
        let scriptSource = """
        (function() {
            try {
                if (window.__notinst_firewall_initialized) return;
                window.__notinst_firewall_initialized = true;

                // ─── 1. Inject Persistent Distraction-Filter Styles ───────
                function injectFilterStyles() {
                    if (document.getElementById('notinst-filter-styles')) return;
                    const style = document.createElement('style');
                    style.id = 'notinst-filter-styles';
                    style.textContent = `
                        /* ─── Reels Elements Suppression ─── */
                        a[href*="/reels/"],
                        a[href*="/reels"],
                        a[href*="/reel/"] {
                            display: none !important;
                            pointer-events: none !important;
                        }

                        [aria-label*="Reels" i],
                        svg[aria-label*="Reels" i] {
                            display: none !important;
                        }

                        a[href$="/reels/"],
                        a[href$="/reels"] {
                            display: none !important;
                        }

                        /* ─── Explore Elements Suppression ─── */
                        /* Hide dedicated bottom/sidebar Explore navigation anchors */
                        a[href="/explore/"],
                        a[href="/explore"] {
                            display: none !important;
                            pointer-events: none !important;
                        }

                        [aria-label="Explore" i],
                        [aria-label="Discover" i],
                        svg[aria-label="Explore" i],
                        svg[aria-label="Discover" i] {
                            display: none !important;
                        }

                        /* ─── Caught-Up Card Styling ─── */
                        #notinst-caught-up-banner {
                            margin: 32px 16px;
                            padding: 24px 20px;
                            background-color: #121214;
                            border: 1px solid #27272a;
                            border-radius: 20px;
                            text-align: center;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                        }

                        #notinst-caught-up-banner h3 {
                            font-size: 16px;
                            font-weight: 700;
                            color: #ffffff;
                            margin: 0 0 8px 0;
                            letter-spacing: -0.01em;
                        }

                        #notinst-caught-up-banner p {
                            font-size: 13px;
                            color: #a1a1aa;
                            margin: 0 0 16px 0;
                            line-height: 1.45;
                        }

                        #notinst-caught-up-banner button {
                            padding: 8px 24px;
                            font-size: 13px;
                            font-weight: 600;
                            background-color: #27272a;
                            color: #f4f4f5;
                            border: none;
                            border-radius: 12px;
                            cursor: pointer;
                            transition: background-color 0.2s ease;
                        }

                        #notinst-caught-up-banner button:active {
                            background-color: #3f3f46;
                        }
                    `;
                    (document.head || document.documentElement).appendChild(style);
                }

                // ─── 2. Suggested Posts Detection & Removal ───────────────
                const SUGGESTED_PHRASES = [
                    'suggested for you',
                    'suggested post',
                    'suggested posts',
                    'because you follow',
                    'because you liked',
                    'because you watched',
                    'suggested reels',
                    'suggested accounts',
                    'popular on instagram'
                ];

                function sendDebugLog(event, payload) {
                    try {
                        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.\(messageHandlerName)) {
                            window.webkit.messageHandlers.\(messageHandlerName).postMessage({
                                event: event,
                                ...payload
                            });
                        }
                    } catch (e) {
                        // ignore messaging errors
                    }
                }

                function isSuggestedArticle(article) {
                    if (!article || article.nodeType !== 1) return null;

                    // 1. Check direct accessible labels
                    const ariaLabel = (article.getAttribute('aria-label') || '').toLowerCase();
                    for (let i = 0; i < SUGGESTED_PHRASES.length; i++) {
                        if (ariaLabel.includes(SUGGESTED_PHRASES[i])) {
                            return SUGGESTED_PHRASES[i];
                        }
                    }

                    // 2. Check inner headers/spans for prominent suggested headings
                    // (Restricting search to headings and top spans avoids false positives in captions)
                    const headingElements = article.querySelectorAll('h2, h3, h4, header span, header div');
                    for (let i = 0; i < headingElements.length; i++) {
                        const text = (headingElements[i].innerText || headingElements[i].textContent || '').trim().toLowerCase();
                        for (let j = 0; j < SUGGESTED_PHRASES.length; j++) {
                            if (text === SUGGESTED_PHRASES[j] || text.startsWith(SUGGESTED_PHRASES[j])) {
                                return SUGGESTED_PHRASES[j];
                            }
                        }
                    }

                    return null;
                }

                function insertCaughtUpCard(anchorElement) {
                    if (document.getElementById('notinst-caught-up-banner')) return;

                    const banner = document.createElement('div');
                    banner.id = 'notinst-caught-up-banner';
                    banner.innerHTML = `
                        <h3>You're all caught up.</h3>
                        <p>You've seen everything from the people you follow.</p>
                        <button id="notinst-close-caught-up" type="button">Close</button>
                    `;

                    const closeBtn = banner.querySelector('#notinst-close-caught-up');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            banner.style.display = 'none';
                        });
                    }

                    if (anchorElement && anchorElement.parentNode) {
                        anchorElement.parentNode.insertBefore(banner, anchorElement);
                    } else {
                        const main = document.querySelector('main');
                        if (main) main.appendChild(banner);
                    }
                }

                function filterFeedRecommendations(root) {
                    try {
                        const target = root || document;

                        // Process article containers (standard Instagram post elements)
                        const articles = target.querySelectorAll ? target.querySelectorAll('article') : [];
                        for (let i = 0; i < articles.length; i++) {
                            const article = articles[i];

                            // Skip already-evaluated nodes
                            if (article.getAttribute('data-notinst-filtered') === 'true') {
                                continue;
                            }

                            const reason = isSuggestedArticle(article);
                            if (reason) {
                                // Confidently identified as a recommendation post
                                article.style.setProperty('display', 'none', 'important');
                                article.setAttribute('data-notinst-filtered', 'true');
                                article.setAttribute('data-notinst-suggested', 'true');

                                sendDebugLog('filtered_suggested_post', { reason: reason });

                                // Inject the clean caught-up card right before the first suggested item
                                insertCaughtUpCard(article);
                            } else {
                                // Mark as verified clean post to avoid re-evaluating
                                article.setAttribute('data-notinst-filtered', 'true');
                            }
                        }

                        // Also check for standalone "Suggested Posts" section divider headers
                        const sectionHeaders = target.querySelectorAll ? target.querySelectorAll('main h2, main h3, main h4') : [];
                        for (let i = 0; i < sectionHeaders.length; i++) {
                            const h = sectionHeaders[i];
                            const text = (h.innerText || h.textContent || '').trim().toLowerCase();
                            if (text === 'suggested posts' || text === 'suggested for you') {
                                const container = h.closest('div[style*="flex"]') || h;
                                container.style.setProperty('display', 'none', 'important');
                                insertCaughtUpCard(container);
                            }
                        }

                        // Also hide standalone "You're all caught up" raw element from Instagram if followed by suggestions,
                        // and replace with our minimal clean card
                        const allHeadings = target.querySelectorAll ? target.querySelectorAll('h2, span') : [];
                        for (let i = 0; i < allHeadings.length; i++) {
                            const el = allHeadings[i];
                            const text = (el.innerText || el.textContent || '').trim().toLowerCase();
                            if (text === "you're all caught up" || text === "you’ve seen all new posts") {
                                const parentCard = el.closest('article, div[style*="flex-direction: column"]');
                                if (parentCard && !document.getElementById('notinst-caught-up-banner')) {
                                    insertCaughtUpCard(parentCard);
                                }
                            }
                        }

                    } catch (e) {
                        // Fail-safe
                    }
                }

                // ─── 3. Intercept Click Events (Capture Phase) ────────────
                document.addEventListener('click', function(e) {
                    try {
                        const target = e.target;
                        if (!target) return;
                        const anchor = target.closest ? target.closest('a') : null;
                        if (!anchor) return;

                        const href = anchor.getAttribute('href') || anchor.pathname || '';
                        const lower = href.toLowerCase();

                        // Block clicks to Reels
                        if (lower.startsWith('/reels') || lower.startsWith('/reel/') || lower.includes('/reels/')) {
                            e.preventDefault();
                            e.stopPropagation();
                            sendDebugLog('blocked_reels_click', { href: href });
                            window.location.href = '/';
                            return;
                        }

                        // Block clicks to pure Explore recommendation grid (while allowing search)
                        if ((lower === '/explore/' || lower === '/explore') && !lower.includes('search') && !lower.includes('query')) {
                            e.preventDefault();
                            e.stopPropagation();
                            sendDebugLog('blocked_explore_click', { href: href });
                            window.location.href = '/';
                            return;
                        }
                    } catch (e) {
                        // Fail-safe
                    }
                }, true);

                // ─── 4. Intercept Single-Page History Transitions ─────────
                const originalPushState = history.pushState;
                history.pushState = function(state, title, url) {
                    try {
                        if (url && typeof url === 'string') {
                            const lower = url.toLowerCase();
                            if (lower.startsWith('/reels') || lower.startsWith('/reel/') || lower.includes('/reels/')) {
                                sendDebugLog('blocked_push_state_reels', { url: url });
                                return originalPushState.apply(this, [state, title, '/']);
                            }
                            if ((lower === '/explore/' || lower === '/explore') && !lower.includes('search') && !lower.includes('query')) {
                                sendDebugLog('blocked_push_state_explore', { url: url });
                                return originalPushState.apply(this, [state, title, '/']);
                            }
                        }
                    } catch (e) {
                        // Fail-safe
                    }
                    return originalPushState.apply(this, arguments);
                };

                const originalReplaceState = history.replaceState;
                history.replaceState = function(state, title, url) {
                    try {
                        if (url && typeof url === 'string') {
                            const lower = url.toLowerCase();
                            if (lower.startsWith('/reels') || lower.startsWith('/reel/') || lower.includes('/reels/')) {
                                sendDebugLog('blocked_replace_state_reels', { url: url });
                                return originalReplaceState.apply(this, [state, title, '/']);
                            }
                            if ((lower === '/explore/' || lower === '/explore') && !lower.includes('search') && !lower.includes('query')) {
                                sendDebugLog('blocked_replace_state_explore', { url: url });
                                return originalReplaceState.apply(this, [state, title, '/']);
                            }
                        }
                    } catch (e) {
                        // Fail-safe
                    }
                    return originalReplaceState.apply(this, arguments);
                };

                // ─── 5. Initialize Styles & Continuous Mutation Observer ───
                injectFilterStyles();
                filterFeedRecommendations(document);

                const observer = new MutationObserver(function(mutations) {
                    injectFilterStyles();
                    for (let i = 0; i < mutations.length; i++) {
                        const mutation = mutations[i];
                        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                            for (let j = 0; j < mutation.addedNodes.length; j++) {
                                filterFeedRecommendations(mutation.addedNodes[j]);
                            }
                        }
                    }
                });

                observer.observe(document.documentElement || document.body, {
                    childList: true,
                    subtree: true
                });

            } catch (err) {
                // Fail-safe: do not disrupt page execution
                console.error('[Notinst] WebFilters init error:', err);
            }
        })();
        """

        return WKUserScript(
            source: scriptSource,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
    }
}
#endif

