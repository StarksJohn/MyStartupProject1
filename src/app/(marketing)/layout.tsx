import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

/**
 * Shared layout for the (marketing) route group - landing, legal pages, etc.
 * Dashboard / Day / Chat routes live outside this group and get their own chrome.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
