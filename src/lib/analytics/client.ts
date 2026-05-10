"use client";

import {
  isProductEventName,
  sanitizeEventProperties,
  type ProductEventName,
  type ProductEventProperties,
} from "@/lib/analytics/events";

type AnalyticsProvider = "plausible" | "umami";

declare global {
  interface Window {
    __analyticsProvider?: AnalyticsProvider;
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
    umami?: {
      track?: (
        eventName: string,
        properties?: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

function getAnalyticsProvider(): AnalyticsProvider | null {
  if (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    window.__analyticsProvider
  ) {
    return window.__analyticsProvider;
  }

  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  if (provider === "plausible" || provider === "umami") {
    return provider;
  }

  return null;
}

export function trackEvent(
  eventName: ProductEventName,
  properties?: ProductEventProperties
) {
  const provider = getAnalyticsProvider();

  if (!provider || !isProductEventName(eventName)) {
    return;
  }

  const props = sanitizeEventProperties(properties);

  try {
    if (provider === "plausible") {
      window.plausible?.(eventName, props ? { props } : undefined);
      return;
    }

    window.umami?.track?.(eventName, props);
  } catch {
    // Analytics must never block the product flow.
  }
}
