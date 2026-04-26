/**
 * Root Providers composition for Fracture Recovery Companion.
 *
 * Order is intentional:
 *   SessionProvider  -> outermost, exposes auth for all client trees
 *   QueryProvider    -> depends on session for authenticated requests
 *   ThemeProvider    -> innermost wrapper, switches CSS variables
 *   Toaster          -> sibling under ThemeProvider to inherit theme
 *
 * v1 is single-locale English; no dictionary-provider is wired here
 * (lease-guard's i18n stack is explicitly out of scope — see ADR-002).
 */
"use client";

import { SessionProvider } from "./session-provider";
import { QueryProvider } from "./query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}

export { SessionProvider } from "./session-provider";
export { QueryProvider } from "./query-provider";
