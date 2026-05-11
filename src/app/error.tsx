"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureRenderError } from "@/lib/observability/client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureRenderError(error, "app_route");
  }, [error]);

  return (
    <main className="container py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recovery support
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          We could not load this screen safely
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Please try again. If this keeps happening, return to your recovery
          plan or contact support. This message does not change your medical
          guidance or replace clinician care.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/progress">Go to progress</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
