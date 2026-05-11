"use client";

import { useEffect } from "react";

import { captureRenderError } from "@/lib/observability/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureRenderError(error, "global");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ margin: "0 auto", maxWidth: 720, padding: 32 }}>
          <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>
            Recovery support
          </p>
          <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>
            We could not load the app safely
          </h1>
          <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
            Please try again in a moment. If this keeps happening, contact
            support. This product remains educational support and does not
            replace clinician care.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#111827",
              border: 0,
              borderRadius: 8,
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
              marginTop: 16,
              padding: "12px 16px",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
