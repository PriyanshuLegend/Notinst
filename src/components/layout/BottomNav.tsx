'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/messages', label: 'Messages', Icon: MessageCircle },
  { href: '/profile', label: 'Profile', Icon: User },
  { href: '/settings', label: 'Firewall', Icon: Shield },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center
                 h-16 border-t border-zinc-200 dark:border-zinc-800
                 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md
                 safe-area-bottom"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            id={`nav-${label.toLowerCase()}`}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full
                        transition-colors duration-150
                        ${isActive
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.2 : 1.8}
              className="transition-all duration-150"
            />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
