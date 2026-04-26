import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/refund", label: "Refund Policy" },
  { href: "/legal/disclaimer", label: "Medical Disclaimer" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-testid="marketing-footer"
      className="border-t border-border/60 bg-muted/30"
    >
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          &copy; {year} Fracture Recovery Companion. Not a medical device.
          Informational only.
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
