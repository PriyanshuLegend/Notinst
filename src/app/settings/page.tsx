'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Smartphone,
  EyeOff,
  VideoOff,
  Compass,
  DollarSign,
  Flag,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';

interface FilterSetting {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  defaultEnabled: boolean;
  tag: string;
}

const FILTER_ITEMS: FilterSetting[] = [
  {
    id: 'blockReels',
    name: 'Reels Firewall',
    description: 'Hides Reels navigation tabs and redirects direct /reels/ and /reel/ paths back to the chronological feed.',
    icon: VideoOff,
    defaultEnabled: true,
    tag: 'Core Anti-Distraction',
  },
  {
    id: 'blockExplore',
    name: 'Explore Discovery Firewall',
    description: 'Blocks algorithmic Explore recommendation grids while explicitly preserving Search (/explore/search/) and hashtag lookups.',
    icon: Compass,
    defaultEnabled: true,
    tag: 'Search Preserved',
  },
  {
    id: 'filterSuggested',
    name: 'Suggested Posts Filter',
    description: 'Conservatively filters in-feed "Suggested for you" and "Because you follow" posts. Ordinary posts from followed accounts remain visible.',
    icon: EyeOff,
    defaultEnabled: true,
    tag: 'Conservative',
  },
  {
    id: 'filterSponsored',
    name: 'Sponsored Content Filter',
    description: 'Detects and removes officially labeled "Sponsored" posts and paid partnership advertorials.',
    icon: DollarSign,
    defaultEnabled: true,
    tag: 'Ad-Free Feed',
  },
  {
    id: 'cleanMobileUI',
    name: 'Clean Mobile Navigation',
    description: 'Focuses bottom navigation on exactly 3 tabs: Home, Direct Messages, and Profile, while hiding Search and Reels.',
    icon: Smartphone,
    defaultEnabled: true,
    tag: '3-Tab Focus',
  },
  {
    id: 'showCaughtUpCard',
    name: 'All Caught Up Marker',
    description: 'Displays a clean, minimal "You\'re all caught up" card when reaching the end of followed posts, avoiding infinite discovery traps.',
    icon: Flag,
    defaultEnabled: true,
    tag: 'End-State Indicator',
  },
];

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const copyUserscriptCode = async () => {
    try {
      const res = await fetch('/notinst.user.js');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24 text-zinc-100">
        {/* Header */}
        <div className="space-y-2 border-b border-zinc-800 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Notinst Firewall
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Safari Userscript v1.2.3
                  </span>
                </h1>
                <p className="text-xs text-zinc-400">
                  Branded distraction filtering for Instagram Web on iPhone
                </p>
              </div>
            </div>

            <Link
              href="/diagnostics"
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sliders size={13} />
              Diagnostics
            </Link>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/notinst.user.js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            <Download size={16} />
            Install Userscript (Raw)
          </a>
          <button
            onClick={copyUserscriptCode}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Script Code'}
          </button>
        </div>

        {/* iPhone Safari Installation Walkthrough */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Smartphone size={18} className="text-blue-400" />
              iPhone Safari Setup Guide
            </h2>
            <span className="text-xs text-zinc-400">Step {activeStep} of 4</span>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div
              onClick={() => setActiveStep(1)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeStep === 1
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    Install the &quot;Userscripts&quot; Safari Extension
                    <a
                      href="https://itunes.apple.com/app/userscripts/id1463298887"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      App Store <ExternalLink size={11} />
                    </a>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Install the free and open-source <strong>Userscripts</strong> app from the iOS App Store.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setActiveStep(2)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeStep === 2
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">Enable Extension in Safari Settings</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Go to iPhone <strong>Settings &gt; Safari &gt; Extensions &gt; Userscripts</strong>. Turn it <strong>ON</strong> and grant permission for <strong>instagram.com</strong> (or &quot;Always Allow on All Websites&quot;).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setActiveStep(3)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeStep === 3
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">Add Notinst to Userscripts</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Open Safari, navigate to this server&apos;s <code>/notinst.user.js</code> or tap the <strong>Install Userscript</strong> button above. Tap <strong>Save/Install</strong> in the extension prompt. Alternatively, tap the Userscripts extension icon, tap <strong>+ (New)</strong>, and paste the copied code.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setActiveStep(4)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeStep === 4
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">Browse Distraction-Free on Instagram</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Navigate to <strong>instagram.com</strong>. You will notice the floating <strong>🛡️ Notinst</strong> badge at the bottom right. Reels and discovery grids are removed, and only followed content appears!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configurable Filters Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Active Firewall Filters
            </h2>
            <span className="text-xs text-zinc-400">All 6 filters enabled by default</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {FILTER_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700/50 shrink-0">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Honest Architecture Disclosures */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle size={18} />
            Honest Architecture & Platform Disclosures
          </div>
          <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <p>
              <strong>1. Same-Origin Browser Security:</strong> A separate website cannot directly read, modify, or proxy Instagram&apos;s web DOM due to browser cross-origin boundaries. Running through Safari&apos;s local <em>Userscripts</em> extension runs code securely on your device within Instagram&apos;s page context.
            </p>
            <p>
              <strong>2. Meta Official API Limitation:</strong> Meta&apos;s Graph API does <em>not</em> provide an endpoint for retrieving your consumer Following feed or Followed Stories (the Basic Display API was completely retired in December 2024). The Notinst web portal connects to official Business/Creator tools (profile, DMs, publishing), while the Safari Userscript delivers the distraction-free consumer browsing experience.
            </p>
            <p>
              <strong>3. Resilient Fallbacks:</strong> If Instagram updates its DOM structure, Notinst&apos;s text-anchored and semantic selectors fail safely by leaving content visible rather than breaking page layout.
            </p>
            <p>
              <strong>4. Independent Userscript Settings:</strong> Because the browser sandbox isolates storage between this site and instagram.com, live setting adjustments are made and stored directly on Instagram via the floating <strong>🛡️ Notinst</strong> modal, ensuring immediate responsiveness without round-trip latency.
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <HelpCircle size={18} className="text-blue-400" />
            Troubleshooting & Frequently Asked Questions
          </div>
          <div className="text-xs text-zinc-400 space-y-3">
            <div>
              <div className="text-zinc-200 font-medium mb-0.5">Why does the 🛡️ Notinst badge not appear on Instagram?</div>
              <p>Make sure the Userscripts extension has permission to run on <code>instagram.com</code>. In Safari, tap the <strong>AA</strong> or puzzle icon in the address bar &gt; <strong>Userscripts</strong> &gt; set permissions to <strong>Always Allow</strong>.</p>
            </div>
            <div>
              <div className="text-zinc-200 font-medium mb-0.5">Does searching for accounts still work?</div>
              <p>Yes. The Explore firewall explicitly preserves account searches (e.g. <code>/explore/search/</code>) and hashtag queries. Only the infinite recommendation grid is blocked.</p>
            </div>
            <div>
              <div className="text-zinc-200 font-medium mb-0.5">How do I update the userscript?</div>
              <p>Whenever an update is released in Notinst, open the Userscripts extension in Safari, tap Notinst, and tap <strong>Check for Updates</strong> or re-paste the script from this page.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
