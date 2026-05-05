import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "admin";
  if (role !== "admin") redirect("/calendar");

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  // All events this year
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events } = await (supabase.from("events") as any)
    .select("id, date, event_type, status, price_final, venue_id, venue:venues(name)")
    .gte("date", yearStart)
    .lte("date", yearEnd)
    .neq("status", "cancelled");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads } = await (supabase.from("leads") as any)
    .select("id, status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: venues } = await (supabase.from("venues") as any)
    .select("id, name")
    .eq("is_active", true);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">דשבורד — {currentYear}</h1>
      <DashboardStats
        events={events ?? []}
        leads={leads ?? []}
        venues={venues ?? []}
      />
    </div>
  );
}
