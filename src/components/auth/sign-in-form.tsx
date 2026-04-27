"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface SignInFormProps {
  callbackUrl: string;
  showDevLogin: boolean;
}

export function SignInForm({ callbackUrl, showDevLogin }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleMagicLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const result = await signIn("email", {
      email,
      callbackUrl,
      redirect: false,
    });

    setStatus(result?.error ? "error" : "sent");
  }

  async function handleDevLogin() {
    await signIn("dev-login", {
      email,
      callbackUrl,
    });
  }

  return (
    <div className="container flex min-h-[70dvh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Identity recovery
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Sign in with a secure magic link
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your email and we will send a secure link to continue your
          recovery companion setup. No password required.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleMagicLinkSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="you@example.com"
            />
          </div>

          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        {status === "sent" ? (
          <p className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Check your email for a secure sign-in link.
          </p>
        ) : null}

        {status === "error" ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            We could not send the Magic Link. Check email settings and try again.
          </p>
        ) : null}

        {showDevLogin ? (
          <div className="mt-6 border-t pt-6">
            <p className="text-xs text-muted-foreground">
              Development only: bypass email delivery for local E2E.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={handleDevLogin}
              disabled={!email}
            >
              Continue as test user
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
