"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackEvent } from "@/lib/analytics/client";
import type { ProductEventProperties } from "@/lib/analytics/events";

interface AnalyticsLinkProps extends ComponentProps<typeof Link> {
  eventProperties: ProductEventProperties;
}

export function AnalyticsLink({
  eventProperties,
  onClick,
  ...props
}: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent("cta_click", eventProperties);
        onClick?.(event);
      }}
    />
  );
}
