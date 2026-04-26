import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        We couldn&rsquo;t find that page.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The link may be outdated, or the page hasn&rsquo;t shipped yet.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
