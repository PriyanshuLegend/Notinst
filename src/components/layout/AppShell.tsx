import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * AppShell wraps each page with consistent padding so content clears
 * the bottom nav, and optionally renders a sticky header.
 */
export default function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      {header && (
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          {header}
        </header>
      )}
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
