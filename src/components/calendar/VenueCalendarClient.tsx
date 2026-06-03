"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { VenueCalendar } from "./VenueCalendar";

const VenueCalendarLazy = dynamic(
  () => import("./VenueCalendar").then((m) => ({ default: m.VenueCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-10 w-56 bg-muted rounded animate-pulse" />
        <div className="h-[calc(100vh-180px)] min-h-[520px] bg-muted/30 rounded-lg animate-pulse" />
      </div>
    ),
  }
);

export function VenueCalendarClient(props: ComponentProps<typeof VenueCalendar>) {
  return <VenueCalendarLazy {...props} />;
}
