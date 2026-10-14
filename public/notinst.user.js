/* eslint-disable */
// ==UserScript==
// @name         Notinst — Distraction-Free Instagram
// @namespace    https://notinst.local/
// @version      1.2.1
// @description  Eliminate Reels, Explore discovery loops, sponsored ads, and algorithmic suggested posts while preserving followed feeds, Stories, DMs, profiles, and search. Includes robust clean mobile navigation alignment with live DOM diagnostics.
// @author       Notinst
// @match        https://*.instagram.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

/**
 * Notinst Instagram Firewall — Safari Userscript v1.2.1
 *
 * Core Principles:
 * 1. Safe & Conservative: If unsure, do not hide. Never hide ordinary followed posts.
 * 2. Search Preservation: Keep /explore/search/, tags, and query params functional.
 * 3. Configurable: Every filter can be independently enabled or disabled.
 * 4. Resilient: Uses semantic attributes and text indicators, never obfuscated CSS classes.
 * 5. Private: Zero credential harvesting, zero token extraction, zero external proxying.
 * 6. Clean Mobile UI: Evenly spaces bottom navigation and centers icons without collisions.
 * 7. Real Diagnostics: In-modal live DOM inspection & visual element highlighting.
 */

(function () {
  'use strict';

  if (window.__notinst_userscript_initialized) return;
  window.__notinst_userscript_initialized = true;

  const SCRIPT_VERSION = '1.2.1';

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
  }

  // ─── 2. Diagnostics Data Store ────────────────────────────────────────────
  const navDiagnostic = {
    version: SCRIPT_VERSION,
    cleanMobileUI: config.cleanMobileUI,
    stylesheetExists: false,
    containerFound: false,
    containerSelector: 'None',
    linksDetectedCount: 0,
    linksList: [],
    hiddenSlotsCount: 0,
    lastStatus: 'Initializing',
    lastError: null,
    lastRunTime: null,
    highlightActive: false,
  };

  // ─── 3. Dynamic Styles Injection ──────────────────────────────────────────
  const STYLE_ID = 'notinst-firewall-styles';

  function applyDynamicStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }

    navDiagnostic.stylesheetExists = !!document.getElementById(STYLE_ID);

    let css = `
      /* ─── Notinst Shared Utility Styles ─── */
      #notinst-caught-up-banner {
        margin: 32px 16px;
        padding: 24px 20px;
        background-color: #121214;
        border: 1px solid #27272a;
        border-radius: 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        color: #f4f4f5;
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

      /* ─── Floating Settings Badge (Safe positioning above bottom bar) ─── */
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

      /* ─── In-Page Settings Modal (Responsive & Scrollable for mobile) ─── */
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
        max-width: 60%;
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

    // ─── Conditional Reels Hiding ───
    if (config.blockReels) {
      css += `
        a[href*="/reels/"],
        a[href*="/reels"],
        a[href*="/reel/"],
        a[href$="/reels/"],
        a[href$="/reels"] {
          display: none !important;
          pointer-events: none !important;
        }
        [aria-label*="Reels" i],
        svg[aria-label*="Reels" i] {
          display: none !important;
        }
      `;
    }

    // ─── Conditional Explore Hiding (while preserving search) ───
    if (config.blockExplore) {
      css += `
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
      `;
    }

    // ─── Clean Mobile Bottom Navigation Alignment ───
    if (config.cleanMobileUI) {
      css += `
        @media (max-width: 768px) {
          /* Distribute navigation slots evenly */
          [data-notinst-nav-row="true"] {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-around !important;
            align-items: center !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Force each active slot to take an equal fraction of the bar */
          [data-notinst-nav-slot="true"] {
            display: flex !important;
            flex: 1 1 0% !important;
            justify-content: center !important;
            align-items: center !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Suppress empty slot wrappers left by blocked items */
          [data-notinst-nav-slot="true"][data-notinst-hidden-slot="true"] {
            display: none !important;
            flex: 0 0 0% !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Horizontally center every navigation link within its slot */
          [data-notinst-nav-item="true"] {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
          }

          /* Explicitly center the Direct Messages / DM icon and badge container */
          [data-notinst-nav-dm="true"],
          [data-notinst-nav-dm="true"] > div,
          [data-notinst-nav-dm="true"] svg {
            margin-left: auto !important;
            margin-right: auto !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
        }
      `;
    }

    style.textContent = css;
  }

  // ─── 4. Route Interception (Reels & Explore to Home) ───────────────────────
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

  function checkAndRedirectURL(urlStr) {
    if (!urlStr) return;
    try {
      const u = new URL(urlStr, window.location.origin);
      const path = u.pathname.toLowerCase();

      // Reels Firewall check
      if (config.blockReels) {
        if (path.startsWith('/reels') || path.startsWith('/reel/')) {
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
      if (config.blockReels && (lower.startsWith('/reels') || lower.startsWith('/reel/'))) {
        return originalPushState.apply(this, [state, title, '/']);
      }
      if (config.blockExplore && (lower === '/explore' || lower === '/explore/') && !isExploreSearch(url)) {
        return originalPushState.apply(this, [state, title, '/']);
      }
    }
    return originalPushState.apply(this, arguments);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (state, title, url) {
    if (url && typeof url === 'string') {
      const lower = url.toLowerCase();
      if (config.blockReels && (lower.startsWith('/reels') || lower.startsWith('/reel/'))) {
        return originalReplaceState.apply(this, [state, title, '/']);
      }
      if (config.blockExplore && (lower === '/explore' || lower === '/explore/') && !isExploreSearch(url)) {
        return originalReplaceState.apply(this, [state, title, '/']);
      }
    }
    return originalReplaceState.apply(this, arguments);
  };

  // Intercept in-page click events (capture phase)
  document.addEventListener(
    'click',
    function (e) {
      try {
        const anchor = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!anchor) return;

        const href = anchor.getAttribute('href') || anchor.pathname || '';
        const lower = href.toLowerCase();

        if (config.blockReels && (lower.startsWith('/reels') || lower.startsWith('/reel/'))) {
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

  // ─── 5. Resilient Content Filtering (Suggested & Sponsored) ────────────────
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
      const target = root || document;
      const articles = target.querySelectorAll ? target.querySelectorAll('article') : [];

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        if (config.filterSuggested) {
          const suggestedReason = isSuggestedArticle(article);
          if (suggestedReason) {
            article.style.setProperty('display', 'none', 'important');
            article.setAttribute('data-notinst-filtered', 'true');
            article.setAttribute('data-notinst-reason', 'suggested');
            insertCaughtUpCard(article);
            continue;
          }
        }

        if (config.filterSponsored) {
          const sponsoredReason = isSponsoredArticle(article);
          if (sponsoredReason) {
            article.style.setProperty('display', 'none', 'important');
            article.setAttribute('data-notinst-filtered', 'true');
            article.setAttribute('data-notinst-reason', 'sponsored');
            continue;
          }
        }

        article.setAttribute('data-notinst-filtered', 'true');
      }

      if (config.filterSuggested) {
        const dividers = target.querySelectorAll ? target.querySelectorAll('main h2, main h3, main h4') : [];
        for (let i = 0; i < dividers.length; i++) {
          const h = dividers[i];
          const text = (h.innerText || h.textContent || '').trim().toLowerCase();
          if (text === 'suggested posts' || text === 'suggested for you') {
            const container = h.closest('div[style*="flex"]') || h;
            container.style.setProperty('display', 'none', 'important');
            insertCaughtUpCard(container);
          }
        }
      }
    } catch {
      // Fail-safe
    }
  }

  // ─── 6. Robust Mobile Navigation Alignment Engine ────────────────────────
  function findBottomNavigationElements() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const allInteractive = document.querySelectorAll('a, div[role="button"]');
    const bottomLinks = [];

    // 1. Identify interactive links physically located in the bottom 110px of the mobile viewport
    for (let i = 0; i < allInteractive.length; i++) {
      const el = allInteractive[i];
      const r = el.getBoundingClientRect();

      // Must be visible and in the bottom navigation bar band
      if (r.height >= 18 && r.width >= 18 && r.top > vh - 110) {
        const href = (el.getAttribute('href') || el.pathname || '').toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        const hasGraphic = el.querySelector('svg') || el.querySelector('img');

        // Verify it looks like a bottom navigation item (Home, Search, Create, Reels, DMs, Profile)
        const isNav =
          hasGraphic ||
          href === '/' ||
          href.includes('/explore') ||
          href.includes('/reels') ||
          href.includes('/direct') ||
          href.includes('/create') ||
          aria.includes('home') ||
          aria.includes('search') ||
          aria.includes('direct') ||
          aria.includes('messages') ||
          aria.includes('profile');

        if (isNav) {
          bottomLinks.push(el);
        }
      }
    }

    if (bottomLinks.length < 2) {
      return { container: null, row: null, links: [] };
    }

    // 2. Identify common parent flex row container
    // Start from the first detected link and find its lowest common ancestor that holds all bottom links
    let commonParent = bottomLinks[0].parentElement;
    while (commonParent && commonParent !== document.body) {
      const containsAll = bottomLinks.every((link) => commonParent.contains(link));
      if (containsAll) break;
      commonParent = commonParent.parentElement;
    }

    if (!commonParent) {
      return { container: null, row: null, links: bottomLinks };
    }

    // Identify if there is an inner row holding the slots directly
    let row = commonParent;
    for (let i = 0; i < commonParent.children.length; i++) {
      const child = commonParent.children[i];
      const childMatches = bottomLinks.filter((l) => child.contains(l));
      if (childMatches.length === bottomLinks.length) {
        row = child;
        break;
      }
    }

    return { container: commonParent, row: row, links: bottomLinks };
  }

  function alignMobileNavigation(root) {
    navDiagnostic.lastRunTime = new Date().toLocaleTimeString();

    if (!config.cleanMobileUI) {
      // Reversible restoration of Instagram's native layout
      try {
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
        });

        const items = document.querySelectorAll('[data-notinst-nav-item]');
        items.forEach((it) => {
          it.removeAttribute('data-notinst-nav-item');
          it.removeAttribute('data-notinst-nav-dm');
          it.style.removeProperty('display');
          it.style.removeProperty('justify-content');
          it.style.removeProperty('align-items');
          it.style.removeProperty('width');
          it.style.removeProperty('margin');
        });

        navDiagnostic.lastStatus = 'Clean UI disabled (Native layout restored)';
      } catch (err) {
        navDiagnostic.lastError = err.message;
      }
      return;
    }

    try {
      const { container, row, links } = findBottomNavigationElements();

      if (!row || links.length < 2) {
        navDiagnostic.containerFound = false;
        navDiagnostic.containerSelector = 'None';
        navDiagnostic.linksDetectedCount = links.length;
        navDiagnostic.linksList = [];
        navDiagnostic.lastStatus = 'Scanning: Waiting for bottom bar mount';
        return;
      }

      navDiagnostic.containerFound = true;
      navDiagnostic.containerSelector = `<${row.tagName.toLowerCase()}${row.className ? ' class="' + String(row.className).split(' ')[0] + '"' : ''}>`;
      navDiagnostic.linksDetectedCount = links.length;
      navDiagnostic.linksList = links.map((l) => {
        const href = l.getAttribute('href') || l.pathname || '';
        const aria = l.getAttribute('aria-label') || '';
        return href ? href.replace(/^https?:\/\/[^\/]+/, '') : (aria || 'icon');
      });

      // 1. Tag and configure the row flex container
      row.setAttribute('data-notinst-nav-row', 'true');
      row.style.setProperty('display', 'flex', 'important');
      row.style.setProperty('flex-direction', 'row', 'important');
      row.style.setProperty('justify-content', 'space-around', 'important');
      row.style.setProperty('align-items', 'center', 'important');
      row.style.setProperty('width', '100%', 'important');

      let hiddenCount = 0;

      // 2. Configure each detected link and its slot wrapper
      links.forEach((link) => {
        link.setAttribute('data-notinst-nav-item', 'true');
        link.style.setProperty('display', 'flex', 'important');
        link.style.setProperty('justify-content', 'center', 'important');
        link.style.setProperty('align-items', 'center', 'important');
        link.style.setProperty('width', '100%', 'important');
        link.style.setProperty('margin', '0 auto', 'important');

        const href = (link.getAttribute('href') || link.pathname || '').toLowerCase();
        const aria = (link.getAttribute('aria-label') || '').toLowerCase();

        // Detect if link is Direct / Messages
        const isDM = href.includes('/direct') || aria.includes('direct') || aria.includes('message') || aria.includes('chat');
        if (isDM) {
          link.setAttribute('data-notinst-nav-dm', 'true');
          const firstChild = link.firstElementChild;
          if (firstChild) {
            firstChild.style.setProperty('margin-left', 'auto', 'important');
            firstChild.style.setProperty('margin-right', 'auto', 'important');
          }
        }

        // Trace up to the immediate slot wrapper under the row
        let slot = link;
        while (slot && slot.parentElement !== row) {
          slot = slot.parentElement;
        }

        if (slot) {
          slot.setAttribute('data-notinst-nav-slot', 'true');

          const isReel = href.includes('/reels') || aria.includes('reels');
          const isExplore = href === '/explore/' || (href.startsWith('/explore') && !isExploreSearch(href));

          if ((config.blockReels && isReel) || (config.blockExplore && isExplore)) {
            // Blocked item: cleanly collapse the slot wrapper to 0 width
            slot.setAttribute('data-notinst-hidden-slot', 'true');
            slot.style.setProperty('display', 'none', 'important');
            slot.style.setProperty('flex', '0 0 0%', 'important');
            slot.style.setProperty('width', '0', 'important');
            hiddenCount++;
          } else {
            // Active item: distribute evenly
            slot.removeAttribute('data-notinst-hidden-slot');
            slot.style.setProperty('display', 'flex', 'important');
            slot.style.setProperty('flex', '1 1 0%', 'important');
            slot.style.setProperty('justify-content', 'center', 'important');
            slot.style.setProperty('align-items', 'center', 'important');
            slot.style.setProperty('min-width', '0', 'important');
          }
        }
      });

      navDiagnostic.hiddenSlotsCount = hiddenCount;
      navDiagnostic.lastStatus = `Success: Aligned ${links.length} tabs (${hiddenCount} hidden)`;
      navDiagnostic.lastError = null;
    } catch (err) {
      navDiagnostic.lastStatus = 'Error in alignMobileNavigation';
      navDiagnostic.lastError = err.message;
    }
  }

  // Visual outline verification action
  function toggleNavigationHighlight() {
    navDiagnostic.highlightActive = !navDiagnostic.highlightActive;
    const row = document.querySelector('[data-notinst-nav-row="true"]');
    const slots = document.querySelectorAll('[data-notinst-nav-slot="true"]');
    const items = document.querySelectorAll('[data-notinst-nav-item="true"]');

    if (navDiagnostic.highlightActive && row) {
      row.style.setProperty('outline', '3px dashed #3b82f6', 'important');
      slots.forEach((s) => s.style.setProperty('outline', '2px solid #10b981', 'important'));
      items.forEach((it) => it.style.setProperty('background', 'rgba(59, 130, 246, 0.15)', 'important'));

      // Automatically clear after 8 seconds if user doesn't toggle off
      setTimeout(() => {
        if (navDiagnostic.highlightActive) {
          toggleNavigationHighlight();
        }
      }, 8000);
    } else if (row) {
      row.style.removeProperty('outline');
      slots.forEach((s) => s.style.removeProperty('outline'));
      items.forEach((it) => it.style.removeProperty('background'));
    }

    // Refresh modal diagnostic UI
    renderDiagnosticsInModal();
  }

  // ─── 7. In-Page Settings Badge & Control Modal ─────────────────────────────
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
        <span style="font-size:10px; color:${navDiagnostic.lastError ? '#f87171' : '#34d399'}; font-weight:normal;">
          ${navDiagnostic.lastRunTime || 'Now'}
        </span>
      </h3>
      <div class="notinst-diag-row">
        <span>Userscript Version</span>
        <span class="val">v${navDiagnostic.version}</span>
      </div>
      <div class="notinst-diag-row">
        <span>Clean Mobile UI</span>
        <span class="val" style="color:${isClean ? '#4ade80' : '#f87171'}; font-weight:600;">
          ${isClean ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Injected Stylesheet</span>
        <span class="val">${navDiagnostic.stylesheetExists ? 'Active' : 'Missing'}</span>
      </div>
      <div class="notinst-diag-row">
        <span>Bottom Nav Container</span>
        <span class="val" style="color:${navDiagnostic.containerFound ? '#4ade80' : '#f87171'}">
          ${navDiagnostic.containerFound ? 'Found' : 'Not Found'}
        </span>
      </div>
      <div class="notinst-diag-row">
        <span>Detected Tabs</span>
        <span class="val">${navDiagnostic.linksDetectedCount} tabs</span>
      </div>
      <div class="notinst-diag-row" style="margin-top:2px;">
        <span>Tabs List</span>
        <span class="val" title="${navDiagnostic.linksList.join(', ')}">
          ${navDiagnostic.linksList.length > 0 ? navDiagnostic.linksList.join(', ') : 'None'}
        </span>
      </div>
      <div class="notinst-diag-row" style="margin-top:4px; padding-top:4px; border-top:1px solid #27272a;">
        <span>Status</span>
        <span class="val" style="color:${navDiagnostic.lastError ? '#f87171' : '#38bdf8'}">
          ${navDiagnostic.lastStatus}
        </span>
      </div>
      <div style="margin-top:10px; display:flex; gap:6px;">
        <button id="notinst-diag-test-btn" type="button" class="notinst-btn-secondary" style="flex:1; padding:7px; font-size:11px;">
          ${navDiagnostic.highlightActive ? '✖ Clear Highlights' : '🎯 Highlight Nav Elements'}
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

    // Run a fresh alignment check prior to rendering diagnostics
    alignMobileNavigation(document);

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
            <div class="notinst-toggle-desc">Evenly space & center bottom navigation tabs</div>
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
        if (navDiagnostic.highlightActive) toggleNavigationHighlight();
        modal.remove();
      }
    });

    modal.querySelector('#notinst-modal-save').addEventListener('click', function () {
      if (navDiagnostic.highlightActive) toggleNavigationHighlight();
      modal.remove();
    });
  }

  // Register Tampermonkey / Userscripts menu command if supported
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Configure Notinst Firewall', openSettingsModal);
  }

  // ─── 8. Continuous Mutation Observer with AnimationFrame Throttle ──────────
  applyDynamicStyles();
  alignMobileNavigation(document);
  filterFeedRecommendations(document);

  let isScheduled = false;
  const observer = new MutationObserver(function () {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(function () {
      isScheduled = false;
      applyDynamicStyles();
      alignMobileNavigation(document);
      filterFeedRecommendations(document);
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
    });
  } else {
    injectSettingsBadge();
    alignMobileNavigation(document);
  }
})();
