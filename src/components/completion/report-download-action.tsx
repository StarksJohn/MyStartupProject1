"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReportDownloadAction() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/program/report", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setErrorMessage(
          "We could not prepare your report right now. Please try again."
        );
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recovery-summary-report.html";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("We could not prepare your report right now. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        data-testid="completion-report-download"
      >
        {isDownloading ? "Preparing report..." : "Download summary report"}
      </Button>

      {errorMessage ? (
        <p
          data-testid="completion-report-error"
          role="alert"
          className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
