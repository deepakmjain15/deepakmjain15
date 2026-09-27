import Link from "next/link";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19 12 5l7 14" />
          <path d="M8.5 13h7" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        TripMate <span className="text-brand">AI</span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line/70 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75 sticky top-0 z-20">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="TripMate AI home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/join" className="rounded-lg px-3 py-2 text-muted hover:text-ink">
            Join a trip
          </Link>
          <Link href="/create" className="rounded-lg bg-ink px-3.5 py-2 font-medium text-white hover:bg-black">
            Create a trip
          </Link>
        </nav>
      </div>
    </header>
  );
}
