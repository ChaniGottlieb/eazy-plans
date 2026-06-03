"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { DashboardStats } from "./DashboardStats";

const DashboardStatsLazy = dynamic(
  () => import("./DashboardStats").then((m) => ({ default: m.DashboardStats })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-4 h-52 bg-muted/30 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 h-52 bg-muted/30 animate-pulse" />
          <div className="border rounded-lg p-4 h-52 bg-muted/30 animate-pulse" />
        </div>
      </div>
    ),
  }
);

export function DashboardStatsClient(props: ComponentProps<typeof DashboardStats>) {
  return <DashboardStatsLazy {...props} />;
}
