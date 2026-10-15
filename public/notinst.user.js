/* eslint-disable */
// ==UserScript==
// @name         Notinst — Distraction-Free Instagram
// @namespace    https://notinst.local/
// @version      1.2.3
// @description  Eliminate Reels, Explore discovery loops, sponsored ads, and algorithmic suggested posts while preserving followed feeds, Stories, DMs, profiles, and search. Precision 3-icon bottom navigation (Home, DMs, Profile) with live diagnostics.
// @author       Notinst
// @match        https://*.instagram.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

/**
 * Notinst Instagram Firewall — Safari Userscript v1.2.3
 *
 * Core Principles:
 * 1. Safe & Non-Destructive: Never hide or mutate common ancestors, main feed wrappers, or Stories trays.
 * 2. 3-Icon Navigation Focus: Confidently identifies and hides Search/Explore and Reels in verified bottom navigation,
 *    recalculating layout to cleanly present Home, Direct Messages, and Profile.
 * 3. Search & DMs Preserved: Keeps /explore/search/, hashtag lookups, and native Direct Messages intact.
 * 4. Content vs Nav Distinction: Never hide in-feed videos or shared Reel messages in DMs; only block Reels navigation.
 * 5. Idempotent & Reversible: Repeated observer callbacks never compound CSS, and disabling clean UI cleanly restores native layout.
 * 6. Live In-Modal Diagnostics: Real-time inspection of Search slot, Reels slot, visible 3-bar tabs, Stories, and DM state.
 */

(function () {
  'use strict';

  if (window.__notinst_userscript_initialized) return;
  window.__notinst_userscript_initialized = true;

  const SCRIPT_VERSION = '1.2.3';

  // ─── 1. Configuration & Persistence ───────────────────────────────────────
  const DEFAULT_CONFIG = {
    blockReels: true,
    blockExplore: true,
    filterSuggested: true,
    filterSponsored: true,
    showCaughtUpCard: true,
    cleanMobileUI: true,
    showSettingsButton: true,
  };

  const STORAGE_KEY = 'notinst_userscript_config';

  function loadConfig() {
    try {
      if (typeof GM_getValue === 'function') {
        const stored = GM_getValue(STORAGE_KEY, null);
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return { ...DEFAULT_CONFIG, ...JSON.parse(local) };
    } catch {
      // Fallback to defaults on storage errors
    }
    return { ...DEFAULT_CONFIG };
  }

  let config = loadConfig();

  function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    try {
      const serialized = JSON.stringify(config);
      if (typeof GM_setValue === 'function') {
        GM_setValue(STORAGE_KEY, serialized);
      }
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage quota fallback
    }
    applyDynamicStyles();
    alignMobileNavigation(document);
    filterFeedRecommendations(document);
    scanStoriesAndFeed();
  }

  // ─── 2. Route & Nav Classification Helpers ────────────────────────────────
  function isDirectMessagesRoute() {
    const path = (window.location.pathname || '').toLowerCase();
    return path.startsWith('/direct');
  }

  function isFeedRoute() {
    const path = (window.location.pathname || '').toLowerCase();
    return path === '/' || path.startsWith('/?') || path === '';
  }

  function isExploreSearch(urlStr) {
    if (!urlStr) return false;
    const lower = urlStr.toLowerCase();
    return (
      lower.includes('/explore/search') ||
      lower.includes('/explore/tags') ||
      lower.includes('/explore/locations') ||
      lower.includes('query=') ||
      lower.includes('q=') ||
      lower.includes('search')
    );
  }

  function isHomeNavItem(link) {
    if (!link) return false;
    const href = (link.getAttribute('href') || link.pathname || '').toLowerCase();
    const aria = (link.getAttribute('aria-label') || '').toLowerCase();
    const svgAria = (link.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
    return (
      href === '/' ||
      href.startsWith('/?') ||
      aria === 'home' ||
      aria.includes('home') ||
      svgAria === 'home' ||
      svgAria.includes('home')
    );
  }

  function isDirectMessagesNavItem(link) {
    if (!link) return false;
    const href = (link.getAttribute('href') || link.pathname || '').toLowerCase();
    const aria = (link.getAttribute('aria-label') || '').toLowerCase();
    const svgAria = (link.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
    return (
      href.includes('/direct') ||
      aria.includes('direct') ||
      aria.includes('message') ||
      aria.includes('chat') ||
      svgAria.includes('direct') ||
      svgAria.includes('message') ||
      svgAria.includes('chat') ||
      svgAria.includes('messenger')
    );
  }

  function isProfileNavItem(link) {
    if (!link) return false;
    const aria = (link.getAttribute('aria-label') || '').toLowerCase();
    const svgAria = (link.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
    const hasAvatar = !!link.querySelector('img');
    return (
      aria.includes('profile') ||
      svgAria.includes('profile') ||
      hasAvatar
    );
  }

  function isSearchOrExploreNavItem(link) {
    if (!link) return false;
    if (isHomeNavItem(link) || isDirectMessagesNavItem(link) || isProfileNavItem(link)) {
      return false;
    }

    const href = (link.getAttribute('href') || link.pathname || '').toLowerCase();
    const aria = (link.getAttribute('aria-label') || '').toLowerCase();
    const svgAria = (link.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
    const svgTitle = (link.querySelector('svg title')?.textContent || '').toLowerCase();

    return (
      href === '/explore' ||
      href === '/explore/' ||
      href.startsWith('/explore') ||
      href.includes('/search') ||
      aria.includes('search') ||
      aria.includes('explore') ||
      aria.includes('discover') ||
      svgAria.includes('search') ||
      svgAria.includes('explore') ||
      svgAria.includes('discover') ||
      svgTitle.includes('search') ||
      svgTitle.includes('explore')
    );
  }

  function isReelsNavItem(link) {
    if (!link) return false;
    if (isHomeNavItem(link) || isDirectMessagesNavItem(link) || isProfileNavItem(link)) {
      return false;
    }

    const href = (link.getAttribute('href') || link.pathname || '').toLowerCase();
    const aria = (link.getAttribute('aria-label') || '').toLowerCase();
    const svgAria = (link.querySelector('svg')?.getAttribute('aria-label') || '').toLowerCase();
    const svgTitle = (link.querySelector('svg title')?.textContent || '').toLowerCase();

    return (
      href.includes('/reels') ||
      href.includes('/reel') ||
      aria.includes('reels') ||
      aria.includes('reel') ||
      svgAria.includes('reels') ||
      svgAria.includes('reel') ||
      svgTitle.includes('reels') ||
      svgTitle.includes('reel')
    );
  }

  // ─── 3. Diagnostics Data Store ────────────────────────────────────────────
  const diagnostics = {
    version: SCRIPT_VERSION,
    cleanMobileUI: config.cleanMobileUI,
    currentPath: '/',
    currentRoute: 'Home (Feed)',
    isDMRoute: false,
    stylesheetActive: false,
    stories: {
      detected: false,
      count: 0,
      description: 'Scanning...',
    },
    feed: {
      detected: false,
      articlesTotal: 0,
      suggestedFiltered: 0,
      sponsoredFiltered: 0,
    },
    bottomNav: {
      found: false,
      selector: 'None',
      tabsDetected: 0,
      tabsList: [],
      hiddenTabsCount: 0,
      searchHidden: false,
      reelsHidden: false,
      visibleTabs: [],
      status: 'Scanning',
    },
    lastStatus: 'Initializing',
    lastError: null,
    lastRunTime: null,
    highlightActive: false,
  };

  // ─── 4. Dynamic Styles Injection ──────────────────────────────────────────
  const STYLE_ID = 'notinst-firewall-styles';

  function applyDynamicStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }

    diagnostics.stylesheetActive = !!document.getElementById(STYLE_ID);

    let css = `
      /* ─── Notinst Caught-Up Banner ─── */
      #notinst-caught-up-banner {
        margin: 28px 16px;
        padding: 24px 20px;
        background-color: #121214;
        border: 1px solid #27272a;
        border-radius: 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        color: #f4f4f5;
        box-sizing: border-box;
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
        padding: 8px 20px;
        font-size: 13px;
        font-weight: 600;
        background-color: #27272a;
        color: #f4f4f5;
        border: 1px solid #3f3f46;
        border-radius: 12px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      #notinst-caught-up-banner button:active {
        background-color: #3f3f46;
      }

      /* ─── Floating Settings Badge ─── */
      #notinst-settings-pill {
        position: fixed;
        bottom: calc(64px + env(safe-area-inset-bottom, 0px));
        right: 14px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(18, 18, 20, 0.88);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(63, 63, 70, 0.6);
        border-radius: 9999px;
        color: #f4f4f5;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        transition: transform 0.15s ease, opacity 0.15s ease;
        user-select: none;
        -webkit-user-select: none;
      }
      #notinst-settings-pill:active {
        transform: scale(0.95);
      }

      /* ─── In-Page Settings Modal ─── */
      #notinst-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000000;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-sizing: border-box;
      }
      #notinst-modal-card {
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 20px;
        max-width: 380px;
        width: 100%;
        max-height: calc(100vh - 40px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 20px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
        color: #f4f4f5;
        box-sizing: border-box;
      }
      #notinst-modal-card h2 {
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #notinst-modal-card p.subtitle {
        font-size: 12px;
        color: #a1a1aa;
        margin: 0 0 16px 0;
      }
      .notinst-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 0;
        border-bottom: 1px solid #27272a;
      }
      .notinst-toggle-label {
        font-size: 13px;
        font-weight: 500;
        color: #e4e4e7;
      }
      .notinst-toggle-desc {
        font-size: 11px;
        color: #71717a;
      }
      .notinst-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }
      .notinst-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .notinst-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #3f3f46;
        transition: .2s;
        border-radius: 24px;
      }
      .notinst-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .2s;
        border-radius: 50%;
      }
      .notinst-switch input:checked + .notinst-slider {
        background-color: #3b82f6;
      }
      .notinst-switch input:checked + .notinst-slider:before {
        transform: translateX(20px);
      }
      .notinst-diagnostics-card {
        margin-top: 14px;
        padding: 12px;
        background: #111113;
        border: 1px solid #27272a;
        border-radius: 14px;
        font-size: 11px;
        color: #a1a1aa;
      }
      .notinst-diagnostics-card h3 {
        margin: 0 0 6px 0;
        font-size: 12px;
        font-weight: 600;
        color: #60a5fa;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .notinst-diag-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }
      .notinst-diag-row span.val {
        color: #f4f4f5;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        text-align: right;
        max-width: 62%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .notinst-modal-footer {
        margin-top: 16px;
        display: flex;
        gap: 8px;
      }
      .notinst-btn-primary {
        flex: 1;
        padding: 10px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .notinst-btn-primary:active {
        background: #2563eb;
      }
      .notinst-btn-secondary {
        padding: 10px 14px;
        background: #27272a;
        color: #e4e4e7;
        border: 1px solid #3f3f46;
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .notinst-btn-secondary:active {
        background: #3f3f46;
      }
    `;

    // ─── Conditional Reels Hiding (Navigation Contexts Only) ───
    if (config.blockReels) {
      css += `
        /* Hide dedicated Reels tabs in navigation contexts without breaking in-feed video posts or shared DMs */
        nav a[href*="/reels"],
        [role="navigation"] a[href*="/reels"],
        header a[href*="/reels"],
        [data-notinst-verified-bar="true"] [data-notinst-hidden-slot="true"] {
          display: none !important;
          pointer-events: none !important;
        }
        nav [aria-label*="Reels" i],
        [role="navigation"] [aria-label*="Reels" i] {
          display: none !important;
        }
      `;
    }

    // ─── Conditional Explore Hiding (Navigation Contexts Only, Preserves Search) ───
    if (config.blockExplore) {
      css += `
        nav a[href="/explore/"],
        nav a[href="/explore"],
        [role="navigation"] a[href="/explore/"],
        [role="navigation"] a[href="/explore"],
        header a[href="/explore/"],
        header a[href="/explore"] {
          display: none !important;
          pointer-events: none !important;
        }
        nav [aria-label="Explore" i],
        [role="navigation"] [aria-label="Explore" i] {
          display: none !important;
        }
      `;
    }

    // ─── Clean Mobile Bottom Navigation Alignment (Scoped strictly to verified bottom bar) ───
    if (config.cleanMobileUI) {
      css += `
        @media (max-width: 768px) {
          /* Distribute slots strictly within the verified bottom navigation row */
          [data-notinst-verified-bar="true"] [data-notinst-nav-row="true"] {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-around !important;
            align-items: center !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Force each active slot to take an equal fraction of the bar (33.33% each for 3 icons) */
          [data-notinst-verified-bar="true"] [data-notinst-nav-slot="true"] {
            display: flex !important;
            flex: 1 1 0% !important;
            justify-content: center !important;
            align-items: center !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Suppress empty slot wrappers left by blocked items (Search & Reels) */
          [data-notinst-verified-bar="true"] [data-notinst-hidden-slot="true"] {
            display: none !important;
            flex: 0 0 0% !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Horizontally center every navigation link within its slot */
          [data-notinst-verified-bar="true"] [data-notinst-nav-item="true"] {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
          }
        }
      `;
    }

    style.textContent = css;
  }

  // ─── 5. Route Interception (Reels & Explore to Home) ───────────────────────
  function checkAndRedirectURL(urlStr) {
    if (!urlStr) return;
    try {
      const u = new URL(urlStr, window.location.origin);
      const path = u.pathname.toLowerCase();

      // Reels Firewall check (dedicated reels surface)
      if (config.blockReels) {
        if (path === '/reels' || path === '/reels/' || path.startsWith('/reels/')) {
          window.location.replace('/');
          return true;
        }
      }

      // Explore Firewall check (protect search)
      if (config.blockExplore) {
        if ((path === '/explore' || path === '/explore/') && !isExploreSearch(urlStr)) {
          window.location.replace('/');
          return true;
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
    return false;
  }

  // Immediate check on initial script boot
  checkAndRedirectURL(window.location.href);

  // Hook History API for SPA route transitions
  const originalPushState = history.pushState;
  history.pushState = function (state, title, url) {
    if (url && typeof url === 'string') {
      const lower = url.toLowerCase();
      if (config.blockReels && (lower === '/reels' || lower === '/reels/' || lower.startsWith('/reels/'))) {
        return originalPushState.apply(this, [state, title, '/']);
      }
      if (config.blockExplore && (lower === '/explore' || lower === '/explore/') && !isExploreSearch(url)) {
        return originalPushState.apply(this, [state, title, '/']);
      }
    }
    const result = originalPushState.apply(this, arguments);
    onRouteTransition();
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (state, title, url) {
    if (url && typeof url === 'string') {
      const lower = url.toLowerCase();
      if (config.blockReels && (lower === '/reels' || lower === '/reels/' || lower.startsWith('/reels/'))) {
        return originalReplaceState.apply(this, [state, title, '/']);
      }
      if (config.blockExplore && (lower === '/explore' || lower === '/explore/') && !isExploreSearch(url)) {
        return originalReplaceState.apply(this, [state, title, '/']);
      }
    }
    const result = originalReplaceState.apply(this, arguments);
    onRouteTransition();
    return result;
  };

  window.addEventListener('popstate', onRouteTransition);

  function onRouteTransition() {
    diagnostics.currentPath = window.location.pathname;
    diagnostics.isDMRoute = isDirectMessagesRoute();
    if (diagnostics.isDMRoute) {
      diagnostics.currentRoute = 'Direct Messages';
    } else if (isFeedRoute()) {
      diagnostics.currentRoute = 'Home (Feed)';
    } else if (window.location.pathname.startsWith('/explore')) {
      diagnostics.currentRoute = 'Explore / Search';
    } else {
      diagnostics.currentRoute = 'Page / Profile';
    }
  }

  // Intercept in-page click events (capture phase)
  document.addEventListener(
    'click',
    function (e) {
      try {
        const anchor = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!anchor) return;

        const href = anchor.getAttribute('href') || anchor.pathname || '';
        const lower = href.toLowerCase();

        if (config.blockReels && (lower === '/reels' || lower === '/reels/' || lower.startsWith('/reels/'))) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = '/';
          return;
        }

        if (
          config.blockExplore &&
          (lower === '/explore' || lower === '/explore/') &&
          !isExploreSearch(href)
        ) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = '/';
          return;
        }
      } catch {
        // Fail-safe
      }
    },
    true
  );

  // ─── 6. Safe Content Filtering (Suggested & Sponsored) ─────────────────────
  const SUGGESTED_PHRASES = [
    'suggested for you',
    'suggested post',
    'suggested posts',
    'because you follow',
    'because you liked',
    'because you watched',
    'suggested reels',
    'suggested accounts',
    'popular on instagram',
  ];

  function isSuggestedArticle(article) {
    if (!article || article.nodeType !== 1) return null;

    const ariaLabel = (article.getAttribute('aria-label') || '').toLowerCase();
    for (let i = 0; i < SUGGESTED_PHRASES.length; i++) {
      if (ariaLabel.includes(SUGGESTED_PHRASES[i])) return SUGGESTED_PHRASES[i];
    }

    const headings = article.querySelectorAll('h2, h3, h4, header span, header div');
    for (let i = 0; i < headings.length; i++) {
      const text = (headings[i].innerText || headings[i].textContent || '').trim().toLowerCase();
      for (let j = 0; j < SUGGESTED_PHRASES.length; j++) {
        if (text === SUGGESTED_PHRASES[j] || text.startsWith(SUGGESTED_PHRASES[j])) {
          return SUGGESTED_PHRASES[j];
        }
      }
    }
    return null;
  }

  function isSponsoredArticle(article) {
    if (!article || article.nodeType !== 1) return null;

    const ariaLabel = (article.getAttribute('aria-label') || '').toLowerCase();
    if (ariaLabel === 'sponsored' || ariaLabel.includes('advertiser')) {
      return 'aria-label sponsored';
    }

    const headerSpans = article.querySelectorAll('header span, header a, a[href*="/about/ads"]');
    for (let i = 0; i < headerSpans.length; i++) {
      const text = (headerSpans[i].innerText || headerSpans[i].textContent || '').trim().toLowerCase();
      if (text === 'sponsored' || text.startsWith('paid partnership')) {
        return text;
      }
    }
    return null;
  }

  function insertCaughtUpCard(anchorElement) {
    if (!config.showCaughtUpCard) return;
    if (document.getElementById('notinst-caught-up-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'notinst-caught-up-banner';
    banner.innerHTML = `
      <h3>You're all caught up.</h3>
      <p>You've seen everything from the people you follow.</p>
      <button id="notinst-close-caught-up" type="button">Dismiss</button>
    `;

    const closeBtn = banner.querySelector('#notinst-close-caught-up');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
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
      // Direct Messages must remain 100% untouched by content filtering
      if (isDirectMessagesRoute()) return;

      // Only filter recommendations on Home feed
      if (!isFeedRoute()) return;

      const target = root || document;
      const articles = target.querySelectorAll ? target.querySelectorAll('article') : [];

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        // Never filter Stories tray or elements containing story links
        if (article.querySelector('a[href*="/stories/"]')) continue;

        if (config.filterSuggested) {
          const suggestedReason = isSuggestedArticle(article);
          if (suggestedReason) {
            article.style.setProperty('display', 'none', 'important');
            article.setAttribute('data-notinst-filtered', 'suggested');
            insertCaughtUpCard(article);
            continue;
          }
        }

        if (config.filterSponsored) {
          const sponsoredReason = isSponsoredArticle(article);
          if (sponsoredReason) {
            article.style.setProperty('display', 'none', 'important');
            article.setAttribute('data-notinst-filtered', 'sponsored');
            continue;
          }
        }

        article.setAttribute('data-notinst-filtered', 'clean');
      }

      // Hide only isolated "Suggested posts" divider headings without collapsing parent containers
      if (config.filterSuggested) {
        const dividers = target.querySelectorAll ? target.querySelectorAll('main h2, main h3, main h4') : [];
        for (let i = 0; i < dividers.length; i++) {
          const h = dividers[i];
          const text = (h.innerText || h.textContent || '').trim().toLowerCase();
          if (text === 'suggested posts' || text === 'suggested for you') {
            let dividerEl = h;
            if (h.parentElement && h.parentElement.tagName === 'DIV' && h.parentElement.children.length === 1) {
              dividerEl = h.parentElement;
            }
            dividerEl.style.setProperty('display', 'none', 'important');
            dividerEl.setAttribute('data-notinst-filtered', 'suggested-divider');
            insertCaughtUpCard(dividerEl);
          }
        }
      }
    } catch {
      // Fail-safe
    }
  }

  // ─── 7. Safe & Verified Bottom Navigation Alignment Engine ────────────────
  /**
   * Identifies ONLY the genuine fixed mobile bottom navigation bar.
   * Never touches scrolling feed content, Stories trays, or Direct Message conversations.
   */
  function findVerifiedBottomNavigation() {
    // If in Direct Messages, Instagram hides or repurposes bottom bar; preserve native behavior
    if (isDirectMessagesRoute()) {
      return null;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;

    // Mobile screens only
    if (vw > 768) {
      return null;
    }

    const candidates = document.querySelectorAll(
      'nav, [role="navigation"], footer, div[style*="fixed"], div[style*="sticky"]'
    );

    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];

      // Exclude main, article, headers, and Notinst modal UI
      if (
        el.closest('main') ||
        el.closest('article') ||
        el.closest('#notinst-modal-backdrop') ||
        el.id === 'notinst-settings-pill'
      ) {
        continue;
      }

      // Check computed positioning: must be fixed or sticky
      const style = window.getComputedStyle(el);
      const isFixed = style.position === 'fixed' || style.position === 'sticky';
      if (!isFixed) continue;

      const rect = el.getBoundingClientRect();
      // Must be physically anchored at the bottom edge of the mobile viewport
      const isAtBottom = rect.bottom >= vh - 10 && rect.top >= vh - 85;
      const hasBarHeight = rect.height >= 34 && rect.height <= 85;
      const hasBarWidth = rect.width >= vw * 0.7;

      if (!isAtBottom || !hasBarHeight || !hasBarWidth) continue;

      // Check for navigation links
      const links = Array.from(el.querySelectorAll('a, div[role="link"], div[role="tab"]'));
      if (links.length < 3 || links.length > 7) continue;

      // Must contain standard top-level tabs (Home + Search/Explore/Profile/Reels/DMs)
      const hasHome = links.some((l) => isHomeNavItem(l));
      const hasOtherNav = links.some(
        (l) =>
          isSearchOrExploreNavItem(l) ||
          isReelsNavItem(l) ||
          isDirectMessagesNavItem(l) ||
          isProfileNavItem(l)
      );

      if (hasHome && hasOtherNav) {
        // Find the inner row that holds the slots directly
        let row = el;
        if (el.children.length === 1 && links.every((l) => el.children[0].contains(l))) {
          row = el.children[0];
        }

        // Identify the slot wrappers (direct children of row)
        const slots = Array.from(row.children).filter((child) =>
          links.some((l) => child.contains(l))
        );

        if (slots.length >= 3 && slots.length <= 7) {
          return { container: el, row, slots, links };
        }
      }
    }

    return null;
  }

  function cleanUpBottomNavigationStyles() {
    try {
      const bars = document.querySelectorAll('[data-notinst-verified-bar]');
      bars.forEach((b) => b.removeAttribute('data-notinst-verified-bar'));

      const rows = document.querySelectorAll('[data-notinst-nav-row]');
      rows.forEach((r) => {
        r.removeAttribute('data-notinst-nav-row');
        r.style.removeProperty('display');
        r.style.removeProperty('flex-direction');
        r.style.removeProperty('justify-content');
        r.style.removeProperty('align-items');
        r.style.removeProperty('width');
      });

      const slots = document.querySelectorAll('[data-notinst-nav-slot]');
      slots.forEach((s) => {
        s.removeAttribute('data-notinst-nav-slot');
        s.removeAttribute('data-notinst-hidden-slot');
        s.style.removeProperty('display');
        s.style.removeProperty('flex');
        s.style.removeProperty('justify-content');
        s.style.removeProperty('align-items');
        s.style.removeProperty('min-width');
        s.style.removeProperty('margin');
        s.style.removeProperty('padding');
        s.style.removeProperty('width');
      });

      const items = document.querySelectorAll('[data-notinst-nav-item]');
      items.forEach((it) => {
        it.removeAttribute('data-notinst-nav-item');
        it.style.removeProperty('display');
        it.style.removeProperty('justify-content');
        it.style.removeProperty('align-items');
        it.style.removeProperty('width');
        it.style.removeProperty('margin');
      });
    } catch {
      // Fail-safe
    }
  }

  function alignMobileNavigation(root) {
    diagnostics.lastRunTime = new Date().toLocaleTimeString();

    if (!config.cleanMobileUI) {
      cleanUpBottomNavigationStyles();
      diagnostics.bottomNav.found = false;
      diagnostics.bottomNav.status = 'Clean UI disabled (Native layout active)';
      return;
    }

    try {
      const nav = findVerifiedBottomNavigation();

      if (!nav) {
        // Clean up any stale attributes if bottom bar is no longer present (e.g. inside DMs)
        cleanUpBottomNavigationStyles();
        diagnostics.bottomNav.found = false;
        diagnostics.bottomNav.selector = 'None';
        diagnostics.bottomNav.tabsDetected = 0;
        diagnostics.bottomNav.tabsList = [];
        diagnostics.bottomNav.hiddenTabsCount = 0;
        diagnostics.bottomNav.searchHidden = false;
        diagnostics.bottomNav.reelsHidden = false;
        diagnostics.bottomNav.visibleTabs = [];
        diagnostics.bottomNav.status = isDirectMessagesRoute()
          ? 'Bypassed (In Direct Messages)'
          : 'Scanning: Waiting for verified bottom bar';
        return;
      }

      const { container, row, slots, links } = nav;

      diagnostics.bottomNav.found = true;
      diagnostics.bottomNav.selector = `<${container.tagName.toLowerCase()} class="${String(container.className || '').split(' ')[0]}">`;
      diagnostics.bottomNav.tabsDetected = links.length;
      diagnostics.bottomNav.tabsList = links.map((l) => {
        const href = l.getAttribute('href') || l.pathname || '';
        const aria = l.getAttribute('aria-label') || '';
        const svg = l.querySelector('svg')?.getAttribute('aria-label') || '';
        return href ? href.replace(/^https?:\/\/[^\/]+/, '') : (aria || svg || 'tab');
      });

      // Mark the verified bottom bar container
      container.setAttribute('data-notinst-verified-bar', 'true');

      // Tag and configure row flex container
      row.setAttribute('data-notinst-nav-row', 'true');
      row.style.setProperty('display', 'flex', 'important');
      row.style.setProperty('flex-direction', 'row', 'important');
      row.style.setProperty('justify-content', 'space-around', 'important');
      row.style.setProperty('align-items', 'center', 'important');
      row.style.setProperty('width', '100%', 'important');

      let hiddenCount = 0;
      let searchHidden = false;
      let reelsHidden = false;
      const visibleTabsList = [];

      // Configure each detected slot and its link
      slots.forEach((slot) => {
        const link = slot.querySelector('a, div[role="link"], div[role="tab"]');
        const href = link ? (link.getAttribute('href') || link.pathname || '').toLowerCase() : '';
        const aria = link ? (link.getAttribute('aria-label') || '').toLowerCase() : '';
        const svg = link?.querySelector('svg')?.getAttribute('aria-label')?.toLowerCase() || '';

        const isHome = isHomeNavItem(link);
        const isDM = isDirectMessagesNavItem(link);
        const isProfile = isProfileNavItem(link);

        const isSearch = !isHome && !isDM && !isProfile && isSearchOrExploreNavItem(link);
        const isReel = !isHome && !isDM && !isProfile && isReelsNavItem(link);

        // Hide Search/Explore and Reels slots in the verified bottom navigation bar
        const shouldHide =
          (config.cleanMobileUI && (isSearch || isReel)) ||
          (config.blockReels && isReel) ||
          (config.blockExplore && isSearch);

        if (shouldHide) {
          slot.setAttribute('data-notinst-hidden-slot', 'true');
          slot.style.setProperty('display', 'none', 'important');
          slot.style.setProperty('flex', '0 0 0%', 'important');
          slot.style.setProperty('width', '0', 'important');
          slot.style.setProperty('margin', '0', 'important');
          slot.style.setProperty('padding', '0', 'important');
          hiddenCount++;
          if (isSearch) searchHidden = true;
          if (isReel) reelsHidden = true;
        } else {
          slot.removeAttribute('data-notinst-hidden-slot');
          slot.setAttribute('data-notinst-nav-slot', 'true');
          slot.style.setProperty('display', 'flex', 'important');
          slot.style.setProperty('flex', '1 1 0%', 'important');
          slot.style.setProperty('justify-content', 'center', 'important');
          slot.style.setProperty('align-items', 'center', 'important');
          slot.style.setProperty('min-width', '0', 'important');
          slot.style.removeProperty('width');

          let tabName = 'Tab';
          if (isHome) tabName = 'Home';
          else if (isDM) tabName = 'Direct Messages';
          else if (isProfile) tabName = 'Profile';
          else tabName = aria || svg || (href ? href.replace(/^https?:\/\/[^\/]+/, '') : 'Tab');
          visibleTabsList.push(tabName);

          if (link) {
            link.setAttribute('data-notinst-nav-item', 'true');
            link.style.setProperty('display', 'flex', 'important');
            link.style.setProperty('justify-content', 'center', 'important');
            link.style.setProperty('align-items', 'center', 'important');
            link.style.setProperty('width', '100%', 'important');
            link.style.setProperty('margin', '0 auto', 'important');
          }
        }
      });

      diagnostics.bottomNav.hiddenTabsCount = hiddenCount;
      diagnostics.bottomNav.searchHidden = searchHidden;
      diagnostics.bottomNav.reelsHidden = reelsHidden;
      diagnostics.bottomNav.visibleTabs = visibleTabsList;
      diagnostics.bottomNav.status = `Verified: ${visibleTabsList.length} visible (${hiddenCount} hidden)`;
      diagnostics.lastError = null;
    } catch (err) {
      diagnostics.bottomNav.status = 'Error in alignMobileNavigation';
      diagnostics.lastError = err.message;
    }
  }

  // ─── 8. Stories & Feed Diagnostics Scanner ────────────────────────────────
  function scanStoriesAndFeed() {
    const isDM = isDirectMessagesRoute();
    diagnostics.isDMRoute = isDM;
    diagnostics.currentPath = window.location.pathname;

    if (isDM) {
      diagnostics.currentRoute = 'Direct Messages';
      diagnostics.stories.detected = false;
      diagnostics.stories.count = 0;
      diagnostics.stories.description = 'Bypassed in DMs';
      return;
    }

    if (isFeedRoute()) {
      diagnostics.currentRoute = 'Home (Feed)';
    } else if (window.location.pathname.startsWith('/explore')) {
      diagnostics.currentRoute = 'Explore / Search';
    } else {
      diagnostics.currentRoute = 'Page / Profile';
    }

    // Detect Stories tray on page
    const storyLinks = document.querySelectorAll('a[href*="/stories/"]');
    if (storyLinks.length > 0) {
      diagnostics.stories.detected = true;
      diagnostics.stories.count = storyLinks.length;
      diagnostics.stories.description = `Preserved & Active (${storyLinks.length} items detected)`;
    } else {
      diagnostics.stories.detected = false;
      diagnostics.stories.count = 0;
      diagnostics.stories.description =
        diagnostics.currentRoute === 'Home (Feed)'
          ? 'None detected (tray may still be loading)'
          : 'N/A on this route';
    }

    // Detect Feed articles
    const articles = document.querySelectorAll('article');
    diagnostics.feed.detected = articles.length > 0;
    diagnostics.feed.articlesTotal = articles.length;

    let suggestedCount = 0;
    let sponsoredCount = 0;
    articles.forEach((a) => {
      const reason = a.getAttribute('data-notinst-filtered');
      if (reason === 'suggested') suggestedCount++;
      if (reason === 'sponsored') sponsoredCount++;
    });
    diagnostics.feed.suggestedFiltered = suggestedCount;
    diagnostics.feed.sponsoredFiltered = sponsoredCount;
  }

  // Visual outline verification action
  function toggleNavigationHighlight() {
    diagnostics.highlightActive = !diagnostics.highlightActive;
    const bar = document.querySelector('[data-notinst-verified-bar="true"]');
    const row = document.querySelector('[data-notinst-nav-row="true"]');
    const slots = document.querySelectorAll('[data-notinst-nav-slot="true"]');
    const items = document.querySelectorAll('[data-notinst-nav-item="true"]');

    if (diagnostics.highlightActive && row) {
      if (bar) bar.style.setProperty('outline', '2px solid #60a5fa', 'important');
      row.style.setProperty('outline', '3px dashed #3b82f6', 'important');
      slots.forEach((s) => s.style.setProperty('outline', '2px solid #10b981', 'important'));
      items.forEach((it) => it.style.setProperty('background', 'rgba(59, 130, 246, 0.15)', 'important'));

      setTimeout(() => {
        if (diagnostics.highlightActive) {
          toggleNavigationHighlight();
        }
      }, 8000);
    } else {
      if (bar) bar.style.removeProperty('outline');
      if (row) row.style.removeProperty('outline');
      slots.forEach((s) => s.style.removeProperty('outline'));
      items.forEach((it) => it.style.removeProperty('background'));
    }

    renderDiagnosticsInModal();
  }

  // ─── 9. In-Page Settings Badge & Control Modal ─────────────────────────────
  function injectSettingsBadge() {
    if (!config.showSettingsButton) return;
    if (document.getElementById('notinst-settings-pill')) return;

    const pill = document.createElement('div');
    pill.id = 'notinst-settings-pill';
    pill.innerHTML = `🛡️ Notinst`;
    pill.title = 'Configure Notinst Firewall';
    pill.addEventListener('click', openSettingsModal);
    (document.body || document.documentElement).appendChild(pill);
  }

  function renderDiagnosticsInModal() {
    const card = document.getElementById('notinst-modal-card');
    if (!card) return;

    scanStoriesAndFeed();

    let diagBox = document.getElementById('notinst-modal-diag-box');
    if (!diagBox) {
      diagBox = document.createElement('div');
      diagBox.id = 'notinst-modal-diag-box';
      diagBox.className = 'notinst-diagnostics-card';
      const footer = card.querySelector('.notinst-modal-footer');
      if (footer) card.insertBefore(diagBox, footer);
      else card.appendChild(diagBox);
    }

    const isClean = config.cleanMobileUI;
    diagBox.innerHTML = `
      <h3>
        <span>🔍 Live DOM Diagnostics</span>
        <span style="font-size:10px; color:${diagnostics.lastError ? '#f87171' : '#34d399'}; font-weight:normal;">
          ${diagnostics.lastRunTime || 'Now'}
        </span>
      </h3>
      <div class="notinst-diag-row">
        <span>Userscript Version</span>
        <span class="val">v${diagnostics.version}</span>
      </div>
      <div class="notinst-diag-row">
        <span>Active Route</span>
        <span class="val" style="color:${diagnostics.isDMRoute ? '#38bdf8' : '#e4e4e7'};">
          ${diagnostics.currentRoute}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Stories Tray</span>
        <span class="val" style="color:${diagnostics.stories.detected ? '#4ade80' : '#a1a1aa'}">
          ${diagnostics.stories.description}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Main Feed</span>
        <span class="val">
          ${diagnostics.feed.articlesTotal} posts (${diagnostics.feed.suggestedFiltered} sug, ${diagnostics.feed.sponsoredFiltered} ad)
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Search / Explore Slot</span>
        <span class="val" style="color:${diagnostics.bottomNav.searchHidden ? '#4ade80' : '#f59e0b'}; font-weight:600;">
          ${diagnostics.bottomNav.searchHidden ? 'Hidden (Blocked)' : (diagnostics.bottomNav.found ? 'Visible' : 'N/A')}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Reels Nav Slot</span>
        <span class="val" style="color:${diagnostics.bottomNav.reelsHidden ? '#4ade80' : '#f59e0b'}; font-weight:600;">
          ${diagnostics.bottomNav.reelsHidden ? 'Hidden (Blocked)' : (diagnostics.bottomNav.found ? 'Visible' : 'N/A')}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Visible Nav Tabs</span>
        <span class="val" style="color:#60a5fa;" title="${diagnostics.bottomNav.visibleTabs.join(', ')}">
          ${diagnostics.bottomNav.visibleTabs.length > 0 ? diagnostics.bottomNav.visibleTabs.join(' · ') : 'None'}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Clean Mobile UI</span>
        <span class="val" style="color:${isClean ? '#4ade80' : '#f87171'}; font-weight:600;">
          ${isClean ? 'ENABLED (3 Tabs)' : 'DISABLED'}
        </span>
      </div>
      <div class="notinst-diag-row" style="margin-top:4px; padding-top:4px; border-top:1px solid #27272a;">
        <span>Status</span>
        <span class="val" style="color:${diagnostics.lastError ? '#f87171' : '#38bdf8'}">
          ${diagnostics.bottomNav.status}
        </span>
      </div>
      <div style="margin-top:10px; display:flex; gap:6px;">
        <button id="notinst-diag-test-btn" type="button" class="notinst-btn-secondary" style="flex:1; padding:7px; font-size:11px;">
          ${diagnostics.highlightActive ? '✖ Clear Highlights' : '🎯 Highlight Nav Elements'}
        </button>
      </div>
    `;

    const btn = document.getElementById('notinst-diag-test-btn');
    if (btn) {
      btn.addEventListener('click', toggleNavigationHighlight);
    }
  }

  function openSettingsModal() {
    if (document.getElementById('notinst-modal-backdrop')) return;

    alignMobileNavigation(document);
    scanStoriesAndFeed();

    const modal = document.createElement('div');
    modal.id = 'notinst-modal-backdrop';
    modal.innerHTML = `
      <div id="notinst-modal-card">
        <h2>
          <span>🛡️ Notinst Firewall</span>
          <span style="font-size:12px; font-weight:normal; color:#a1a1aa;">v${SCRIPT_VERSION}</span>
        </h2>
        <p class="subtitle">Distraction-free filters for Safari on iPhone</p>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">Clean Mobile UI</div>
            <div class="notinst-toggle-desc">Focus on 3 tabs: Home, DMs, & Profile</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-clean-ui" ${config.cleanMobileUI ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">Block Reels</div>
            <div class="notinst-toggle-desc">Hide Reels tab & redirect /reels/</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-reels" ${config.blockReels ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">Block Explore</div>
            <div class="notinst-toggle-desc">Hide discovery grid (keeps Search)</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-explore" ${config.blockExplore ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">Hide Suggested Posts</div>
            <div class="notinst-toggle-desc">Filter recommendation injections</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-suggested" ${config.filterSuggested ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">Hide Sponsored Ads</div>
            <div class="notinst-toggle-desc">Filter paid partnership posts</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-sponsored" ${config.filterSponsored ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-toggle-row">
          <div>
            <div class="notinst-toggle-label">All Caught Up Card</div>
            <div class="notinst-toggle-desc">Show clean end-state marker</div>
          </div>
          <label class="notinst-switch">
            <input type="checkbox" id="notinst-set-caughtup" ${config.showCaughtUpCard ? 'checked' : ''}>
            <span class="notinst-slider"></span>
          </label>
        </div>

        <div class="notinst-modal-footer">
          <button class="notinst-btn-primary" id="notinst-modal-save" type="button">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    renderDiagnosticsInModal();

    // ─── Immediate Real-time Change Listeners ───
    const attachLiveToggle = (id, key) => {
      const el = modal.querySelector(id);
      if (el) {
        el.addEventListener('change', function () {
          config[key] = el.checked;
          saveConfig(config);
          renderDiagnosticsInModal();
        });
      }
    };

    attachLiveToggle('#notinst-set-clean-ui', 'cleanMobileUI');
    attachLiveToggle('#notinst-set-reels', 'blockReels');
    attachLiveToggle('#notinst-set-explore', 'blockExplore');
    attachLiveToggle('#notinst-set-suggested', 'filterSuggested');
    attachLiveToggle('#notinst-set-sponsored', 'filterSponsored');
    attachLiveToggle('#notinst-set-caughtup', 'showCaughtUpCard');

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        if (diagnostics.highlightActive) toggleNavigationHighlight();
        modal.remove();
      }
    });

    modal.querySelector('#notinst-modal-save').addEventListener('click', function () {
      if (diagnostics.highlightActive) toggleNavigationHighlight();
      modal.remove();
    });
  }

  // Register Tampermonkey / Userscripts menu command if supported
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Configure Notinst Firewall', openSettingsModal);
  }

  // ─── 10. Continuous Mutation Observer with AnimationFrame Throttle ─────────
  applyDynamicStyles();
  alignMobileNavigation(document);
  filterFeedRecommendations(document);
  scanStoriesAndFeed();

  let isScheduled = false;
  const observer = new MutationObserver(function () {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(function () {
      isScheduled = false;
      applyDynamicStyles();
      alignMobileNavigation(document);
      filterFeedRecommendations(document);
      scanStoriesAndFeed();
      injectSettingsBadge();
    });
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // Ensure settings badge injects once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectSettingsBadge();
      alignMobileNavigation(document);
      scanStoriesAndFeed();
    });
  } else {
    injectSettingsBadge();
    alignMobileNavigation(document);
    scanStoriesAndFeed();
  }
})();
