import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header
      data-testid="marketing-header"
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="font-semibold tracking-tight text-base sm:text-lg"
          aria-label="Fracture Recovery Companion - Home"
        >
          Fracture Recovery
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-2 sm:gap-4 text-sm"
        >
          {/* Auth-aware entry is wired in Story 2.1; v1 shows a coming-soon CTA. */}
          <Button size="sm" variant="ghost" asChild>
            <Link href="#how-it-works">How it works</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/onboarding">Start my 2-minute quiz</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
