"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export function TripTabs({ code, hasAnalysis }: { code: string; hasAnalysis: boolean }) {
  const pathname = usePathname();
  const tabs: { href: string; label: string; short?: string; dot?: boolean }[] = [
    { href: `/t/${code}`, label: "My preferences" },
    { href: `/t/${code}/dashboard`, label: "Group dashboard", short: "Dashboard" },
    { href: `/t/${code}/results`, label: "Trip options", dot: hasAnalysis },
  ];
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Trip sections">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "inline-flex items-center gap-2 border-b-2 px-2.5 py-3 text-sm whitespace-nowrap transition-colors sm:px-3",
              active ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {tab.short ? (
              <>
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </>
            ) : (
              tab.label
            )}
            {tab.dot && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="available" />}
          </Link>
        );
      })}
    </nav>
  );
}
