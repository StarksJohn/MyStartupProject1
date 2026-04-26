/**
 * NextAuth Session Provider
 * Story 1.1 wires the provider up-front so later auth stories (Story 2.1)
 * can drop in without touching the root layout.
 */
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
