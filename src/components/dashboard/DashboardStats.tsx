"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, type PieLabelRenderProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/types/booking";

const MONTH_NAMES = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

const TYPE_COLORS: Record<string, string> = {
  morning: "#3b82f6",
  evening: "#a855f7",
  full_day: "#22c55e",
  shabbat: "#f97316",
};

const STATUS_COLORS: Record<string, string> = {
  approved: "#22c55e",
  cancelled: "#ef4444",
};

type EventRow = {
  id: string;
  date: string;
  event_type: string;
  status: string;
  price_final: number;
  venue_id: string;
  venue: { name: string } | null;
};

type LeadRow = { id: string; status: string };
type VenueRow = { id: string; name: string };

interface DashboardStatsProps {
  events: EventRow[];
  leads: LeadRow[];
  venues: VenueRow[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border rounded-lg p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function DashboardStats({ events, leads, venues }: DashboardStatsProps) {
  const totalRevenue = useMemo(() =>
    events.filter(e => e.status === "approved").reduce((s, e) => s + (e.price_final ?? 0), 0), [events]);

  const byMonth = useMemo(() => {
    const counts = Array(12).fill(0);
    events.forEach((e) => {
      const m = new Date(e.date).getMonth();
      counts[m]++;
    });
    return MONTH_NAMES.map((name, i) => ({ name: name.slice(0, 3), count: counts[i] }));
  }, [events]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => { map[e.event_type] = (map[e.event_type] ?? 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({
      name: EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS] ?? type,
      value: count,
      color: TYPE_COLORS[type] ?? "#94a3b8",
    }));
  }, [events]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => { map[e.status] = (map[e.status] ?? 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({
      name: status === "approved" ? "מאושר" : status === "pending" ? "ממתין" : "נדחה",
      value: count,
      color: STATUS_COLORS[status] ?? "#94a3b8",
    }));
  }, [events]);

  const topVenues = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    events.forEach((e) => {
      if (!map[e.venue_id]) map[e.venue_id] = { name: e.venue?.name ?? "—", count: 0 };
      map[e.venue_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [events]);

  const bookedLeads = leads.filter(l => l.status === "booked").length;
  const conversionRate = leads.length > 0 ? Math.round((bookedLeads / leads.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="אירועים השנה" value={events.length} />
        <StatCard label="הכנסות מאושרות" value={formatCurrency(totalRevenue)} />
        <StatCard label="לידים" value={leads.length} sub={`המרה ${conversionRate}%`} />
        <StatCard label="אולמות פעילים" value={venues.length} />
      </div>

      {/* Events by month */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-4">אירועים לפי חודש</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byMonth} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="אירועים" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By type */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">חלוקה לפי סוג אירוע</h2>
          {byType.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">אין נתונים</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: PieLabelRenderProps) => `${String(name ?? "")} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false}>
                  {byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By status */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">סטטוס אירועים</h2>
          {byStatus.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">אין נתונים</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: PieLabelRenderProps) => `${String(name ?? "")} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false}>
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top venues */}
      {topVenues.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">אולמות מובילים</h2>
          <div className="space-y-2">
            {topVenues.map((v, i) => (
              <div key={v.name} className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}.</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(v.count / (topVenues[0]?.count ?? 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-32 truncate text-right">{v.name}</span>
                <span className="text-sm text-muted-foreground w-8 text-left">{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
