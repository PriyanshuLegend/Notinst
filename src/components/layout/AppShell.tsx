interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * AppShell provides consistent layout and styling for the Notinst website.
 */
export default function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {header && (
        <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
          {header}
        </header>
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
