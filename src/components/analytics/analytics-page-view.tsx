"use client";

import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics/client";
import type {
  ProductEventName,
  ProductEventProperties,
} from "@/lib/analytics/events";

interface AnalyticsPageViewProps {
  eventName: ProductEventName;
  properties?: ProductEventProperties;
}

export function AnalyticsPageView({
  eventName,
  properties,
}: AnalyticsPageViewProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}
